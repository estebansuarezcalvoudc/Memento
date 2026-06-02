import asyncio
from collections.abc import AsyncGenerator
from datetime import datetime

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
    ConversationStreamState,
    ConversationUpdateRequest,
    DoneEvent,
    RetrievingEvent,
    SendMessageRequest,
    ThinkingEndEvent,
    ThinkingStartEvent,
    TitleEvent,
    TokenEvent,
)
from .rag import Rag
from .thinking_filter import ThinkingStreamFilter

_logger = setup_logger(__name__)

_STREAM_STATE_PERSIST_INTERVAL_SECONDS = 0.25


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
        created_conversation = self._repository.store_conversation(user_id, [])

        task = asyncio.create_task(
            self.send_message(
                created_conversation.id, conversation_create_request, user_id
            )
        )
        task.add_done_callback(
            lambda t: (
                _logger.error(
                    "send_message task failed: %s",
                    t.exception(),
                    exc_info=t.exception(),
                )
                if t.exception()
                else None
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
        - On the first exchange of a conversation (no prior messages), starts
          title generation in the background and emits a TitleEvent before the
          final DoneEvent.
        - Yields a DoneEvent to signal completion of the stream.
        """

        async def _generate() -> AsyncGenerator[ChatEvent, None]:
            conversation_id = request.conversation_id
            user_message = {"role": "user", "content": request.message}
            pending_title_task: asyncio.Task[str] | None = None
            persisted_partial_reply = ""
            last_partial_persist_at = datetime.min

            if conversation_id is None:
                new_conv = self._repository.store_conversation(user_id, [user_message])
                conversation_id = new_conv.id
                yield ConversationCreatedEvent(conversation_id=new_conv.id)

                previous_messages = []
                pending_title_task = asyncio.create_task(
                    self._create_and_store_title(
                        conversation_id, request.message, user_id
                    )
                )
            else:
                dialogue = self._repository.fetch_conversation(conversation_id, user_id)
                previous_messages = dialogue.messages.copy()

                self._repository.append_new_messages_to_conversation(
                    conversation_id, [user_message], user_id
                )

            self._repository.set_stream_state(
                conversation_id=conversation_id,
                user_id=user_id,
                status="retrieving",
            )

            full_reply_parts: list[str] = []
            thinking_filter = ThinkingStreamFilter()
            current_date = request.current_datetime.strftime("%Y-%m-%d")

            yield RetrievingEvent()
            context = await self._rag_service.retrieve_context(
                message=request.message,
                conversation_history=previous_messages,
                current_date=current_date,
                user_id=user_id,
            )

            async for token in self._rag_service.stream_reply(
                message=request.message,
                conversation_history=previous_messages,
                context=context,
                current_date=current_date,
                user_id=user_id,
            ):
                filtered = thinking_filter.consume(token)

                if filtered.thinking_started:
                    self._repository.set_stream_state(
                        conversation_id=conversation_id,
                        user_id=user_id,
                        status="thinking",
                        partial_reply="".join(full_reply_parts),
                    )
                    yield ThinkingStartEvent()

                for visible_chunk in filtered.visible_tokens:
                    full_reply_parts.append(visible_chunk)
                    partial_reply = "".join(full_reply_parts)
                    if self._should_persist_partial_reply(
                        partial_reply,
                        persisted_partial_reply,
                        last_partial_persist_at,
                    ):
                        self._repository.set_stream_state(
                            conversation_id=conversation_id,
                            user_id=user_id,
                            status="streaming",
                            partial_reply=partial_reply,
                        )
                        persisted_partial_reply = partial_reply
                        last_partial_persist_at = datetime.utcnow()
                    yield TokenEvent(content=visible_chunk)

                if filtered.thinking_ended:
                    self._repository.set_stream_state(
                        conversation_id=conversation_id,
                        user_id=user_id,
                        status="streaming",
                        partial_reply="".join(full_reply_parts),
                    )
                    yield ThinkingEndEvent()

            final_filtered = thinking_filter.finalize()
            if final_filtered.thinking_ended:
                yield ThinkingEndEvent()
            for visible_chunk in final_filtered.visible_tokens:
                full_reply_parts.append(visible_chunk)
                yield TokenEvent(content=visible_chunk)

            full_reply = "".join(full_reply_parts)
            assistant_message = {"role": "assistant", "content": full_reply}
            self._repository.append_new_messages_to_conversation(
                conversation_id, [assistant_message], user_id
            )
            self._repository.clear_stream_state(conversation_id, user_id)

            if pending_title_task is not None:
                try:
                    generated_title = await pending_title_task
                except Exception:
                    _logger.exception(
                        "Failed to generate or store title for conversation %s",
                        conversation_id,
                    )
                else:
                    yield TitleEvent(title=generated_title)

            _logger.debug("streaming message processed and persisted")
            yield DoneEvent()

        async def _generate_with_error_state() -> AsyncGenerator[ChatEvent, None]:
            conversation_id_for_error = request.conversation_id

            try:
                async for event in _generate():
                    if isinstance(event, ConversationCreatedEvent):
                        conversation_id_for_error = event.conversation_id
                    yield event
            except Exception:
                if conversation_id_for_error is not None:
                    self._repository.set_stream_state(
                        conversation_id=conversation_id_for_error,
                        user_id=user_id,
                        status="idle",
                        error="Failed to process message",
                    )
                raise

        return _generate_with_error_state()

    @staticmethod
    def _should_persist_partial_reply(
        partial_reply: str,
        persisted_partial_reply: str,
        last_partial_persist_at: datetime,
    ) -> bool:
        if partial_reply == persisted_partial_reply:
            return False

        if len(partial_reply) - len(persisted_partial_reply) >= 40:
            return True

        return (
            datetime.utcnow() - last_partial_persist_at
        ).total_seconds() >= _STREAM_STATE_PERSIST_INTERVAL_SECONDS

    async def _create_and_store_title(
        self, conversation_id: str, message: str, user_id: str
    ) -> str:
        generated_title = await self._rag_service.generate_title(message, user_id)
        self._repository.update_conversation_metadata(
            conversation_id,
            ConversationUpdateRequest(title=generated_title),
            user_id,
        )
        return generated_title

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

    def retrieve_stream_state(self, id: str, user_id: str) -> ConversationStreamState:
        return self._repository.get_stream_state(id, user_id)

    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest, user_id: str
    ):
        return self._repository.update_conversation_metadata(id, metadata, user_id)

    def delete_conversation(self, id: str, user_id: str) -> None:
        return self._repository.delete_conversation(id, user_id)
