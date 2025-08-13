from ..core.logging import setup_logger
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

_logger = setup_logger(__name__)


class ConversationService(metaclass=SingletonMeta):
    def __init__(self) -> None:
        self._repository = ConversationRepository()

    async def create_conversation(
        self, conversation_create_request: ConversationCreateRequest, username: str
    ) -> ConversationCreateResponse:
        id = self._repository.store_conversation("New chat", username)

        assistant_response = await self._try_process_message(
            id, conversation_create_request, username
        )

        return ConversationCreateResponse(
            id=id,
            assistant_response=assistant_response,
        )

    async def send_message(
        self, id: str, send_message_request: SendMessageRequest, username: str
    ) -> str:
        return await self._try_process_message(id, send_message_request, username)

    async def _try_process_message(
        self,
        id: str,
        send_message_request: SendMessageRequest,
        username: str,
    ) -> str:
        try:
            return await self._process_message(id, send_message_request, username)
        except Exception as e:
            _logger.error(f"Error in _process_message: {type(e).__name__}: {str(e)}")
            raise

    async def _process_message(
        self, id: str, send_message_request: SendMessageRequest, username: str
    ):
        async with MCPClient(
            username, send_message_request.language_model_configuration
        ) as client:
            await client.connect_to_server()

            _logger.debug("send_message triggered")

            conversation_history = self._repository.retrieve_dialogue(
                id, username
            ).messages
            user_message = {"role": "user", "content": send_message_request.message}
            conversation_history.append(user_message)

            reply = await client.send_message(conversation_history)
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
