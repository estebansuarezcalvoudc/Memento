import json
import os
import traceback
from contextlib import AsyncExitStack
from typing import Any, Optional

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import OpenAI

from ...core.logging import setup_logger
from ...core.settings import settings

_logger = setup_logger(__name__, log_file="mcp_client.log", show_file_name=False)

_SERVER_PATH = os.path.join(os.path.dirname(__file__), "mcp_server.py")
_MAX_COMPLETION_TOKENS = 1000
_TEMPERATURE = 0.1


class MCPClient:
    def __init__(self, username: str):
        self._username = username
        self._session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

        self.openai = OpenAI(api_key=settings.openai_key)

    async def connect_to_server(self):
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

            self._available_tools = await self._retrieve_available_tools()

        except Exception as e:
            _logger.error(f"Failed to connect to MCP server: {str(e)}")
            _logger.error(f"Server script path: {_SERVER_PATH}")
            raise RuntimeError(f"MCP connection failed: {str(e)}") from e

    async def _retrieve_available_tools(self):
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

        return available_tools

    async def send_message(
        self, conversation_history: list[dict[str, Any]], language_model: str
    ) -> str:
        _logger.info(f"Using model {language_model}")
        try:
            result = await self._process_query(conversation_history, language_model)
            return result
        except Exception as e:
            _logger.error(f"Error sending message to MCP client: {str(e)}")
            _logger.error(f"Exception type: {type(e).__name__}")

            _logger.error(f"Full traceback: {traceback.format_exc()}")
            raise e

    async def _process_query(
        self, conversation_history: list[dict[str, Any]], language_model: str
    ) -> str:
        """Process a query using Ollama via OpenAI API and available tools"""
        if self._session is None:
            raise RuntimeError(
                "MCP session not initialized. Call connect_to_server() first."
            )

        conversation_history = self._add_system_prompt(conversation_history)

        _logger.info("Making initial OpenAI API call")
        response = self.openai.chat.completions.create(
            model=language_model,
            messages=conversation_history,  # type:ignore
            tools=self._available_tools,  # type:ignore
            max_completion_tokens=_MAX_COMPLETION_TOKENS,
            temperature=_TEMPERATURE,
        )

        tool_calls = response.choices[0].message.tool_calls
        _logger.debug(
            f"Calling {len(tool_calls) if tool_calls else 0} tools: {tool_calls}"
        )

        return await self._process_response(
            response, conversation_history, self._available_tools, language_model
        )

    def _add_system_prompt(self, conversation_history):
        if not conversation_history or conversation_history[0].get("role") != "system":
            tool_instructions = self._get_tool_calling_instructions()
            formatting_instructions = self._get_formatting_instructions()

            system_message = {
                "role": "system",
                "content": f"You are a meeting assistant with access to tools.\n\n{tool_instructions}\n\n{formatting_instructions}",
            }
            conversation_history = [system_message] + conversation_history
        return conversation_history

    def _get_tool_calling_instructions(self) -> str:
        """Get the tool calling instructions for the system prompt"""
        return (
            "MANDATORY TOOL CALLING RULE: When users ask about meetings using relative dates (yesterday, today, last Monday, etc.), "
            "you MUST make exactly TWO function calls in this order:\n"
            "1. FIRST CALL: get_current_date() - no exceptions\n"
            "2. SECOND CALL: get_meeting_info_by_date(calculated_date)\n\n"
            "CRITICAL DATE CALCULATION RULES:\n"
            "- ALWAYS use the date returned by get_current_date() as your reference point\n"
            "- NEVER use any other date you think you know\n"
            "- Calculate relative dates by subtracting days from the current date\n"
            "- If the user asks about a week day (for instance, Monday), you will have to retrieve the current date, if it is Friday, for example, you will have to substract 4 days to the current day, since Monday is 4 days before Friday"
            "- Use YYYY-MM-DD format for all dates passed to get_meeting_info_by_date\n"
            "- Examples of calculations:\n"
            "  * If current date is 2024-02-11, then yesterday = 2024-02-10\n"
            "  * If current date is 2025-05-07, then today = 2025-05-07\n"
            "  * If current date is 2025-08-04 (Monday), then last Friday = 2025-08-01\n\n"
            "Instructions on how to calculate the date when the user asks about a week day (for instance, last Monday):\n"
            "- Call the get_current_date function to retrieve the current date\n"
            "- Calculate how many days there are between the week day the user asked and the actual date. There are 7 days in a week: Monday (1), Tuesday (2), Wednesday (3), Thusday (4), Friday (5), Saturday (6), Sunday (7). In order to calculate the date the user asks, you will have to count the days between the day the user asked and the current day. Examples:\n "
            "  - Today is Thursday and the user asks about last Tuesday, then it will be 2 days ago (count Tuesday and Wednesday, 2 days)."
            "  - Today is Monday and the user asks about last Friday, then the date will be 3 days ago (count Friday, Saturday and Sunday, 3 days). So, to retrieve the difference, you will have to count how many days are in between. "
            "Do NOT provide any response to the user until you have made BOTH function calls. "
            "Do NOT skip the get_current_date call even if you think you know the date.\n\n"
            "Example workflow:\n"
            "User: 'What happened in yesterday's meeting?'\n"
            "Your actions: \n"
            "1. Call get_current_date() → receives '2025-08-11'\n"
            "2. Calculate yesterday: 2025-08-11 minus 1 day = 2025-08-10\n"
            "3. Call get_meeting_info_by_date('2025-08-10')\n"
            "4. Then provide response to user based on the meeting data\n\n"
            "IMPORTANT: Always double-check your date calculations before making the second tool call."
        )

    def _get_formatting_instructions(self) -> str:
        """Get the response formatting instructions for the system prompt"""
        return (
            "RESPONSE FORMATTING RULES:\n"
            "- ALWAYS follow the user's specific formatting requests exactly\n"
            "- If the user asks for a single sentence, respond with only one sentence\n"
            "- If the user asks for a short summary, provide a concise summary\n"
            "- If the user asks for detailed information, provide comprehensive details\n"
            "- If the user asks for bullet points, format your response as bullet points\n"
            "- If the user specifies a particular length or style, match it precisely\n"
            "- Pay attention to keywords like 'briefly', 'detailed', 'list', 'summarize', etc."
        )

    async def _process_response(
        self,
        response,
        conversation_history: list[dict[str, Any]],
        available_tools: list,
        language_model: str,
    ) -> str:
        try:
            final_text = []

            message = response.choices[0].message
            _logger.debug(f"Received message: {message}")
            _logger.debug(
                f"Received message: content={message.content}, tool_calls={bool(message.tool_calls)}"
            )

            if message.content:
                final_text.append(message.content)

            if message.tool_calls:
                await self._process_tool_call(
                    available_tools,
                    conversation_history,
                    final_text,
                    message,
                    language_model,
                )
            else:
                _logger.debug("No tool calls to process")

            result = "\n".join(filter(None, final_text))
            _logger.debug(f"Final result length: {len(result)} characters")

            return result

        except Exception as e:
            _logger.error(f"Error in _process_response: {str(e)}")
            _logger.error(
                f"Available tools: {[tool['function']['name'] for tool in available_tools]}"
            )
            raise

    async def _process_tool_call(
        self,
        available_tools: list[dict[str, Any]],
        conversation_history: list[dict[str, Any]],
        final_text: list[str],
        message: Any,
        language_model: str,
    ) -> None:
        try:
            self._append_tool_call_to_conversation_history(
                conversation_history, message
            )

            for i, tool_call in enumerate(message.tool_calls):
                _logger.debug(
                    f"Executing tool call {i+1}/{len(message.tool_calls)}: {tool_call.function.name}"
                )
                await self._execute_tool_call(conversation_history, tool_call)

            response = self.openai.chat.completions.create(
                model=language_model,
                messages=conversation_history,  # type:ignore
                tools=available_tools,  # type:ignore
                max_completion_tokens=_MAX_COMPLETION_TOKENS,
                temperature=_TEMPERATURE,
            )

            if response.choices[0].message.content:
                final_text.append(response.choices[0].message.content)
                _logger.debug(
                    f"Added final response to result: {response.choices[0].message.content[:100]}..."
                )
            elif response.choices[0].message.tool_calls:
                # Model wants to make more tool calls - handle them recursively
                _logger.info(
                    f"Model wants to make {len(response.choices[0].message.tool_calls)} additional tool calls"
                )
                await self._process_tool_call(
                    available_tools,
                    conversation_history,
                    final_text,
                    response.choices[0].message,
                    language_model,
                )
                _logger.warning("Model response has no content")

        except Exception as e:
            _logger.error(f"Error in _process_tool_call: {str(e)}")
            _logger.error(
                f"Tool calls: {[tc.function.name for tc in message.tool_calls]}"
            )
            raise

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

        try:
            result = await self._session.call_tool(  # type:ignore
                tool_name, tool_args  # type: ignore
            )
            _logger.debug(f"Tool {tool_name} result: {str(result.content)[:100]}...")
        except Exception as e:
            _logger.error(f"Failed to execute tool {tool_name}: {str(e)}")
            _logger.error(f"Tool arguments were: {tool_args}")
            raise RuntimeError(
                f"Tool execution failed for {tool_name}: {str(e)}"
            ) from e

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
