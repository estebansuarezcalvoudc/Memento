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
from ...utils.singleton_meta import SingletonMeta

_logger = setup_logger(__name__)


class ConversationService(metaclass=SingletonMeta):
    def __init__(self, repository: ConversationRepository) -> None:
        self._repository: ConversationRepository = repository

    async def create_conversation(
        self, conversation_create_request: ConversationCreateRequest, username: str
    ) -> ConversationCreateResponse:
        model_instructions = ""

        created_conversation = self._repository.store_conversation(
            "New chat", username, [model_instructions]
        )

        asyncio.create_task(
            self.send_message(
                created_conversation.id, conversation_create_request, username
            )
        )

        return created_conversation

    async def send_message(
        self,
        id: str,
        send_message_request: SendMessageRequest,
        username: str,
    ) -> str:
        try:
            dialogue = self._repository.fetch_conversation(id, username)
            conversation_history = dialogue.messages.copy()
            original_length = len(conversation_history)

            user_message = {"role": "user", "content": send_message_request.message}
            conversation_history.append(user_message)

            reply = "chatbot reply"

            assistant_response = {"role": "assistant", "content": reply}
            conversation_history.append(assistant_response)

            new_messages = conversation_history[original_length:]

            self._repository.append_new_messages_to_conversation(
                id, new_messages, username
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
        self, username: str
    ) -> list[ConversationMetadataRetrieve]:
        return self._repository.retrieve_all_conversations_metadata(username)

    def retrieve_dialogue(self, id: str, username: str) -> ConversationDialogueRetrieve:
        dialogue = self._repository.fetch_conversation(id, username)
        return ConversationDialogueRetrieve(messages=dialogue)

    def _filter_displayable_messages(
        self, messages: list[dict]
    ) -> list[dict[str, str]]:
        visible_messages = []

        for message in messages:
            role = message.get("role")

            if role == "user":
                visible_messages.append(
                    {"role": role, "content": message.get("content", "")}
                )
            elif role == "assistant" and "tool_calls" not in message:
                if message.get("content"):  # Solo si tiene contenido
                    visible_messages.append(
                        {"role": role, "content": message.get("content", "")}
                    )

        return visible_messages

    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest, username: str
    ):
        return self._repository.update_conversation_metadata(id, metadata, username)

    def delete_conversation(self, id: str, username: str) -> None:
        return self._repository.delete_conversation(id, username)
