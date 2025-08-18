import json
import os
import traceback
from contextlib import AsyncExitStack
from typing import Any, Optional

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai.types.chat import ChatCompletion

from ...core.logging import setup_logger
from ...schemas.conversation_schema import LanguageModelConfiguration
from ..language_models_utils import create_openai_client
from .prompts import SYSTEM_PROMPT

_logger = setup_logger(__name__, log_file="mcp_client.log", show_file_name=False)

_SERVER_PATH = os.path.join(os.path.dirname(__file__), "mcp_server.py")


class MCPClient:
    def __init__(self):
        self._session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

    async def _get_available_tools(self) -> list[dict]:
        response = await self._session.list_tools()  # type:ignore

        return [
            {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema,
                },
            }
            for tool in response.tools
        ]

    async def send_message(
        self,
        conversation_history: list[dict],
        model_config: LanguageModelConfiguration,
        username: str,
    ) -> str:
        _logger.info(
            f"Using model {model_config.model} with provider {model_config.provider}"
        )

        if self._session is None:
            await self._connect_to_server()

        try:
            result = await self._process_query(
                conversation_history, model_config, username
            )
            return result
        except Exception as e:
            _logger.error(f"Error sending message to MCP client: {str(e)}")
            _logger.error(f"Exception type: {type(e).__name__}")
            _logger.error(f"Full traceback: {traceback.format_exc()}")
            raise e

    async def _connect_to_server(self) -> None:
        _logger.info(f"Attempting to connect to MCP server at: {_SERVER_PATH}")

        if not os.path.exists(_SERVER_PATH):
            raise FileNotFoundError(f"MCP server script not found at: {_SERVER_PATH}")

        server_params = StdioServerParameters(command="python", args=[_SERVER_PATH])

        try:
            stdio_transport = await self.exit_stack.enter_async_context(
                stdio_client(server_params)
            )
            self.stdio, self.write = stdio_transport
            self._session = await self.exit_stack.enter_async_context(
                ClientSession(self.stdio, self.write)
            )

            if self._session is None:
                raise RuntimeError("Failed to establish MCP session")

            await self._session.initialize()
            _logger.info("MCP session initialized successfully")

            self._available_tools = await self._get_available_tools()

        except Exception as e:
            _logger.error(f"Failed to connect to MCP server: {str(e)}")
            _logger.error(f"Server script path: {_SERVER_PATH}")
            raise RuntimeError(f"MCP connection failed: {str(e)}") from e

    async def _process_query(
        self,
        conversation_history: list[dict],
        model_config: LanguageModelConfiguration,
        username: str,
    ) -> str:
        if self._session is None:
            raise RuntimeError(
                "MCP session not initialized. Call connect_to_server() first."
            )

        conversation_history = self._add_system_prompt(conversation_history)

        _logger.info("Making initial OpenAI API call")
        openai = create_openai_client(model_config, _logger)
        response = openai.chat.completions.create(
            model=model_config.model,
            messages=conversation_history,  # type:ignore
            tools=self._available_tools,  # type:ignore
            **model_config.options,
        )

        tool_calls = response.choices[0].message.tool_calls
        _logger.debug(
            f"Calling {len(tool_calls) if tool_calls else 0} tools: {tool_calls}"
        )

        return await self._process_response(
            response, conversation_history, model_config, username
        )

    def _add_system_prompt(self, conversation_history: list[dict]) -> list[dict]:
        if not conversation_history or conversation_history[0].get("role") != "system":
            conversation_history = [SYSTEM_PROMPT] + conversation_history
        return conversation_history

    async def _process_response(
        self,
        response: ChatCompletion,
        conversation_history: list[dict],
        model_config: LanguageModelConfiguration,
        username: str,
    ) -> str:
        final_text = []

        message = response.choices[0].message
        _logger.debug(
            f"Received message: content={message.content}, tool_calls={bool(message.tool_calls)}"
        )

        if message.content:
            final_text.append(message.content)

        if message.tool_calls:
            await self._process_tool_call(
                conversation_history, final_text, message, model_config, username
            )

        result = "\n".join(filter(None, final_text))
        _logger.debug(f"Final result length: {len(result)} characters")

        return result

    async def _process_tool_call(
        self,
        conversation_history: list[dict],
        final_text: list[str],
        message: Any,
        model_config: LanguageModelConfiguration,
        username: str,
    ) -> None:
        self._append_tool_call_to_conversation_history(conversation_history, message)

        for tool_call in message.tool_calls:
            await self._execute_tool_call(conversation_history, tool_call, username)

        openai = create_openai_client(model_config, _logger)
        response = openai.chat.completions.create(
            model=model_config.model,
            messages=conversation_history,  # type:ignore
            tools=self._available_tools,  # type:ignore
            **model_config.options,
        )

        if response.choices[0].message.content:
            final_text.append(response.choices[0].message.content)

        elif response.choices[0].message.tool_calls:
            number_of_calls = len(response.choices[0].message.tool_calls)
            _logger.info(f"Model wants to make {number_of_calls} additional tool calls")
            await self._process_tool_call(
                conversation_history,
                final_text,
                response.choices[0].message,
                model_config,
                username,
            )

    @staticmethod
    def _append_tool_call_to_conversation_history(
        conversation_history: list[dict], message: Any
    ) -> None:
        conversation_history.append(
            {
                "role": "assistant",
                "content": message.content,
                "tool_calls": [
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments,
                        },
                    }
                    for tool_call in message.tool_calls
                ],
            }
        )

    async def _execute_tool_call(
        self, conversation_history: list[dict], tool_call: Any, username: str
    ) -> None:
        if self._session is None:
            raise RuntimeError(
                "MCP session not initialized. Call connect_to_server() first."
            )

        tool_name = tool_call.function.name
        tool_args = MCPClient._get_tool_args(tool_call)

        if self._tool_requires_username(tool_name):
            tool_args["username"] = username
            _logger.info(
                f"Injecting username '{username}' into tool args for {tool_name}"
            )

        _logger.info(f"Calling tool {tool_name} with args {tool_args}")

        result = await self._get_tool_call_result(tool_name, tool_args)

        conversation_history.append(
            {
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(result.content),
            }
        )

    def _tool_requires_username(self, tool_name: str) -> bool:
        for tool in self._available_tools:
            func = tool["function"]
            if func["name"] == tool_name:
                return "username" in func["parameters"].get("properties", {})
        return False

    @staticmethod
    def _get_tool_args(tool_call):
        try:
            tool_args = json.loads(tool_call.function.arguments)
        except json.JSONDecodeError as e:
            _logger.error(f"Failed to parse tool arguments: {e}")
            raise ValueError(
                f"Invalid tool arguments format: {tool_call.function.arguments}"
            )

        return tool_args

    async def _get_tool_call_result(self, tool_name: str, tool_args):
        try:
            result = await self._session.call_tool(  # type:ignore
                tool_name, tool_args  # type: ignore
            )
            _logger.debug(f"Tool {tool_name} result: {str(result.content)[:250]}...")
            return result
        except Exception as e:
            _logger.error(f"Failed to execute tool {tool_name}: {str(e)}")
            _logger.error(f"Tool arguments were: {tool_args}")
            raise

    async def __aenter__(self):
        """Async context manager entry"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - clean up resources"""
        await self.exit_stack.aclose()
