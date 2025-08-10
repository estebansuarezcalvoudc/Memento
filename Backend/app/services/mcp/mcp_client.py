import json
from contextlib import AsyncExitStack
from typing import Any, Optional

import ollama
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.types import TextContent
from openai import OpenAI

from ...core.logging import setup_logger
from ...core.settings import settings
import os

_logger = setup_logger(__name__, log_file="mcp_client.log")

_SERVER_PATH = os.path.join(os.path.dirname(__file__), "mcp_server.py")
_MAX_TOKENS = 4000


class MCPClient:
    def __init__(self, model: str, username: str = ""):
        self._model = model
        self._username = username
        self._session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

        ollama_client = ollama.Client(host=settings.ollama_url)

        try:
            ollama_client.pull(self._model)
            _logger.info(f"Successfully pulled model: {self._model}")
        except Exception as e:
            _logger.error(f"Failed to pull model {self._model}: {str(e)}")
            raise ValueError(f"Failed to initialize model {self._model}: {str(e)}")

        self.openai = OpenAI(
            base_url=settings.ollama_url + "/v1",
            api_key="ollama",
        )

    async def connect_to_server(self):
        """Connect to an MCP server

        Args:
            server_script_path: Path to the server script (.py or .js)
        """
        _logger.info(f"Attempting to connect to MCP server at: {_SERVER_PATH}")

        if not os.path.exists(_SERVER_PATH):
            raise FileNotFoundError(f"MCP server script not found at: {_SERVER_PATH}")

        server_params = StdioServerParameters(
            command="python",
            args=[_SERVER_PATH],
            env={**os.environ, "MCP_USERNAME": self._username},
        )

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

            _logger.info("MCP session created, initializing...")
            await self._session.initialize()
            _logger.info("MCP session initialized successfully")

        except Exception as e:
            _logger.error(f"Failed to connect to MCP server: {str(e)}")
            _logger.error(f"Server script path: {_SERVER_PATH}")
            raise RuntimeError(f"MCP connection failed: {str(e)}") from e

    async def send_message(self, conversation_history: list[dict[str, Any]]) -> str:
        try:
            _logger.debug("send_message called")
            return await self._process_query(conversation_history)
        except Exception as e:
            _logger.error(f"Error sending message to MCP client: {str(e)}")
            raise e

    async def _process_query(self, conversation_history: list[dict[str, Any]]) -> str:
        """Process a query using Ollama via OpenAI API and available tools"""
        if self._session is None:
            raise RuntimeError(
                "MCP session not initialized. Call connect_to_server() first."
            )

        response = await self._session.list_tools()  # type:ignore

        available_tools = [
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

        if not conversation_history or conversation_history[0].get("role") != "system":
            system_message = {
                "role": "system",
                "content": (
                    "You are a helpful assistant with access to tools. "
                    "When a user asks about meetings or dates, use the available tools to get accurate information. "
                    "If a user asks about 'today's meeting' or similar, first use get_current_date to get today's date, "
                    "then use get_meeting_info_by_date with that date to get the meeting information. "
                    "Always use tools when you need current date information or meeting data. "
                ),
            }
            conversation_history = [system_message] + conversation_history

        response = self.openai.chat.completions.create(
            model=self._model,
            messages=conversation_history,  # type:ignore
            tools=available_tools,  # type:ignore
            max_tokens=_MAX_TOKENS,
        )

        tool_calls = response.choices[0].message.tool_calls
        _logger.debug(
            f"Calling {len(tool_calls) if tool_calls else 0} tools: {tool_calls}"
        )

        return await self._process_response(
            response, conversation_history, available_tools
        )

    async def _process_response(
        self,
        response,
        conversation_history: list[dict[str, Any]],
        available_tools: list,
    ) -> str:
        final_text = []

        message = response.choices[0].message
        _logger.debug(
            f"Received message: content={message.content}, tool_calls={bool(message.tool_calls)}"
        )

        if message.content:
            final_text.append(message.content)

        if message.tool_calls:
            _logger.info(f"Processing {len(message.tool_calls)} tool calls")
            await self._process_tool_call(
                available_tools, conversation_history, final_text, message
            )

        result = "\n".join(filter(None, final_text))
        return result

    async def _process_tool_call(
        self,
        available_tools: list[dict[str, Any]],
        conversation_history: list[dict[str, Any]],
        final_text: list[str],
        message: Any,
    ) -> None:
        self._append_tool_call_to_conversation_history(conversation_history, message)

        for tool_call in message.tool_calls:
            await self._execute_tool_call(conversation_history, tool_call)

        response = self.openai.chat.completions.create(
            model=self._model,
            messages=conversation_history,  # type:ignore
            tools=available_tools,  # type:ignore
            max_tokens=_MAX_TOKENS,
        )

        if response.choices[0].message.content:
            final_text.append(response.choices[0].message.content)

    def _append_tool_call_to_conversation_history(
        self, conversation_history: list[dict[str, Any]], message: Any
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
        self, conversation_history: list[dict[str, Any]], tool_call: Any
    ) -> None:
        if self._session is None:
            raise RuntimeError(
                "MCP session not initialized. Call connect_to_server() first."
            )

        tool_name = tool_call.function.name
        try:
            tool_args = json.loads(tool_call.function.arguments)
        except json.JSONDecodeError as e:
            _logger.error(f"Failed to parse tool arguments: {e}")
            raise ValueError(
                f"Invalid tool arguments format: {tool_call.function.arguments}"
            )

        _logger.info(f"Calling tool {tool_name} with args {tool_args}")
        result = await self._session.call_tool(  # type:ignore
            tool_name, tool_args  # type: ignore
        )

        conversation_history.append(
            {
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(result.content),
            }
        )

    async def __aenter__(self):
        """Async context manager entry"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - clean up resources"""
        await self.exit_stack.aclose()
