from ..repositories.conversation_repo import ConversationRepository
from ..schemas.conversation_schema import (
    ConversationCreateRequest,
    ConversationCreateResponse,
    ConversationRetrieve,
    ConversationUpdateRequest,
    DialogueRetrieve,
    SendMessageRequest,
)
from ..utils.singleton_meta import SingletonMeta
from .mcp.mcp_client import MCPClient
from ..core.logging import setup_logger

_logger = setup_logger(__name__)


class ConversationService(metaclass=SingletonMeta):
    def __init__(self) -> None:
        self._model = "qwen3:0.6b"
        self._repository = ConversationRepository()
        self._mcp_client = MCPClient(self._model)
        self._initialized = False

    async def _ensure_initialized(self) -> None:
        """Ensure async initialization is complete"""
        if not self._initialized:
            await self._mcp_client.connect_to_server()
            self._initialized = True

    async def create_conversation(
        self, conversation_create_request: ConversationCreateRequest, username: str
    ) -> ConversationCreateResponse:
        await self._ensure_initialized()
        id = self._repository.store_conversation("New chat", username)
        return ConversationCreateResponse(
            id=id,
            assistant_response=await self.send_message(
                id, conversation_create_request, username
            ),
        )

    async def send_message(
        self, id: str, send_message_request: SendMessageRequest, username: str
    ) -> str:
        await self._ensure_initialized()
        _logger.debug("send_message triggered")

        conversation_history = self._repository.retrieve_dialogue(id, username).messages
        user_message = {"role": "user", "content": send_message_request.message}
        conversation_history.append(user_message)

        reply = await self._mcp_client.send_message(conversation_history)
        assistant_response = {"role": "assistant", "content": reply}

        self._repository.add_user_chatbot_interaction(
            id, user_message, assistant_response, username
        )

        return reply

    def retrieve_all_conversations_metadata(
        self, username: str
    ) -> list[ConversationRetrieve]:
        return self._repository.retrieve_all_conversations_metadata(username)

    def retrieve_dialogue(self, id: str, username: str) -> DialogueRetrieve:
        return self._repository.retrieve_dialogue(id, username)

    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest, username: str
    ):
        return self._repository.update_conversation_metadata(id, metadata, username)

    def delete_conversation(self, id: str, username: str) -> None:
        return self._repository.delete_conversation(id, username)
