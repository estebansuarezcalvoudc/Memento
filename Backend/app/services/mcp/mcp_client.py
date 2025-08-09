import json
from contextlib import AsyncExitStack
from typing import Any, Dict, List, Optional

import ollama
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import OpenAI

from ...core.logging import setup_logger
from ...core.settings import settings

_logger = setup_logger(__name__)

# Constants
DEFAULT_SERVER_PATH = "/Backend/app/services/mcp/mcp_server.py"
DEFAULT_MAX_TOKENS = 1000
OPENAI_API_KEY = "ollama"


class MCPClient:
    def __init__(self, model: str):
        self._model = model
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

    async def connect_to_server(self, server_script_path: Optional[str] = None):
        """Connect to an MCP server

        Args:
            server_script_path: Path to the server script (.py or .js)
        """
        if not server_script_path:
            server_script_path = DEFAULT_SERVER_PATH
        server_params = StdioServerParameters(
            command="python", args=[server_script_path], env=None
        )

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

        response = self.openai.chat.completions.create(
            model=self._model,
            messages=conversation_history,  # type:ignore
            tools=available_tools,  # type:ignore
            max_tokens=DEFAULT_MAX_TOKENS,
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

        if message.content:
            final_text.append(message.content)

        if message.tool_calls:
            await self._process_tool_call(
                available_tools, conversation_history, final_text, message
            )

        return "\n".join(filter(None, final_text))

    async def _process_tool_call(
        self,
        available_tools: List[Dict[str, Any]],
        conversation_history: List[Dict[str, Any]],
        final_text: List[str],
        message: Any,
    ) -> None:
        self._append_tool_call_to_conversation_history(conversation_history, message)

        for tool_call in message.tool_calls:
            await self._execute_tool_call(conversation_history, tool_call)

        response = self.openai.chat.completions.create(
            model=self._model,
            messages=conversation_history,  # type:ignore
            tools=available_tools,  # type:ignore
            max_tokens=DEFAULT_MAX_TOKENS,
        )

        if response.choices[0].message.content:
            final_text.append(response.choices[0].message.content)

    def _append_tool_call_to_conversation_history(
        self, conversation_history: List[Dict[str, Any]], message: Any
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
        self, conversation_history: List[Dict[str, Any]], tool_call: Any
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
        )  # type:ignore

    async def __aenter__(self):
        """Async context manager entry"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - clean up resources"""
        await self.exit_stack.aclose()
