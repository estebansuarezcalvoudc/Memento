import asyncio

from ...core.logging import setup_logger
from ...repositories.interfaces.conversation_repo import ConversationRepository
from ...schemas.conversation.conversation_schema import (
    ConversationCreateRequest,
    ConversationCreateResponse,
    ConversationDialogueRetrieve,
    ConversationMetadataRetrieve,
    ConversationUpdateRequest,
    SendMessageRequest,
)
from .rag import Rag

_logger = setup_logger(__name__)


class ConversationService:
    def __init__(
        self,
        repository: ConversationRepository,
        rag_service: Rag,
    ) -> None:
        self._repository: ConversationRepository = repository
        self._rag_service: Rag = rag_service

    async def create_conversation(
        self, conversation_create_request: ConversationCreateRequest, user_id: str
    ) -> ConversationCreateResponse:
        created_conversation = self._repository.store_conversation(
            "New chat", user_id, []
        )

        asyncio.create_task(
            self.send_message(
                created_conversation.id, conversation_create_request, user_id
            )
        )

        return created_conversation

    async def send_message(
        self,
        id: str,
        send_message_request: SendMessageRequest,
        user_id: str,
    ) -> str:
        try:
            dialogue = self._repository.fetch_conversation(id, user_id)
            conversation_history = dialogue.messages.copy()
            original_length = len(conversation_history)

            user_message = {"role": "user", "content": send_message_request.message}
            conversation_history.append(user_message)

            reply = await self._rag_service.get_reply(
                message=send_message_request.message,
                conversation_history=conversation_history[:-1],
                current_date=send_message_request.current_datetime.strftime("%Y-%m-%d"),
                user_id=user_id,
            )

            assistant_response = {"role": "assistant", "content": reply}
            conversation_history.append(assistant_response)

            new_messages = conversation_history[original_length:]

            self._repository.append_new_messages_to_conversation(
                id, new_messages, user_id
            )

            _logger.debug("message processed")
            return reply
        except Exception as e:
            _logger.error(
                f"Error in send_message: {type(e).__name__}: {str(e)}",
                exc_info=True,
            )
            raise

    def retrieve_all_conversations_metadata(
        self, user_id: str
    ) -> list[ConversationMetadataRetrieve]:
        return self._repository.retrieve_all_conversations_metadata(user_id)

    def retrieve_dialogue(self, id: str, user_id: str) -> ConversationDialogueRetrieve:
        return self._repository.fetch_conversation(id, user_id)

    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest, user_id: str
    ):
        return self._repository.update_conversation_metadata(id, metadata, user_id)

    def delete_conversation(self, id: str, user_id: str) -> None:
        return self._repository.delete_conversation(id, user_id)
