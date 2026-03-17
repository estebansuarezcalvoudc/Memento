import asyncio
from collections.abc import AsyncGenerator

from ...core.logging import setup_logger
from ...repositories.interfaces.conversation_repo import ConversationRepository
from ...schemas.conversation.conversation_schema import (
    ChatEvent,
    ChatRequest,
    ConversationCreatedEvent,
    ConversationCreateRequest,
    ConversationCreateResponse,
    ConversationDialogueRetrieve,
    ConversationMetadataRetrieve,
    ConversationUpdateRequest,
    DoneEvent,
    RetrievingEvent,
    SendMessageRequest,
    TitleEvent,
    TokenEvent,
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

    async def handle_chat(
        self,
        request: ChatRequest,
        user_id: str,
    ) -> AsyncGenerator[ChatEvent, None]:
        """
        Orchestrates the full chat flow and yields typed events:

        - If request.conversation_id is None, creates a new conversation and
          yields a ConversationCreatedEvent before streaming tokens.
        - Persists the user message immediately.
        - Streams LLM tokens as TokenEvent instances.
        - Persists the full assistant reply once streaming is complete.
        - On the first exchange of a conversation (no prior messages), auto-
          generates a title and yields a TitleEvent before the final DoneEvent.
        - Yields a DoneEvent to signal completion of the stream.
        """

        async def _generate() -> AsyncGenerator[ChatEvent, None]:
            conversation_id = request.conversation_id

            if conversation_id is None:
                new_conv = self._repository.store_conversation("New chat", user_id, [])
                conversation_id = new_conv.id
                yield ConversationCreatedEvent(
                    conversation_id=new_conv.id,
                    title=new_conv.title,
                )

            dialogue = self._repository.fetch_conversation(conversation_id, user_id)
            conversation_history = dialogue.messages.copy()

            user_message = {"role": "user", "content": request.message}
            self._repository.append_new_messages_to_conversation(
                conversation_id, [user_message], user_id
            )

            full_reply_parts: list[str] = []
            current_date = request.current_datetime.strftime("%Y-%m-%d")

            yield RetrievingEvent()
            context = await self._rag_service.retrieve_context(
                message=request.message,
                conversation_history=conversation_history,
                current_date=current_date,
                user_id=user_id,
            )

            async for token in self._rag_service.stream_reply(
                message=request.message,
                conversation_history=conversation_history,
                context=context,
                current_date=current_date,
                user_id=user_id,
            ):
                full_reply_parts.append(token)
                yield TokenEvent(content=token)

            full_reply = "".join(full_reply_parts)
            assistant_message = {"role": "assistant", "content": full_reply}
            self._repository.append_new_messages_to_conversation(
                conversation_id, [assistant_message], user_id
            )
            _logger.debug("streaming message processed and persisted")

            # Auto-generate a title on the first exchange, before DoneEvent so
            # the TitleEvent is sent while the WebSocket is still open.
            if len(conversation_history) == 0:
                generated_title = await self._rag_service.generate_title(
                    request.message, user_id
                )
                self._repository.update_conversation_metadata(
                    conversation_id,
                    ConversationUpdateRequest(title=generated_title),
                    user_id,
                )
                yield TitleEvent(title=generated_title)

            yield DoneEvent()

        return _generate()

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
