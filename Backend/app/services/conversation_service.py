from typing import Optional

import ollama

from ..core.settings import settings
from ..database.repositories.conversation_repo import ConversationRepository
from ..schemas.conversation_schema import (
    ConversationCreateRequest,
    ConversationCreateResponse,
    ConversationRetrieve,
    ConversationUpdateRequest,
    DialogueRetrieve,
    SendMessageRequest,
)
from ..utils.singleton_meta import SingletonMeta


class ConversationService(metaclass=SingletonMeta):
    def __init__(self) -> None:
        self._model = "llama3.2"
        self._repository = ConversationRepository()

    def create_conversation(
        self, conversation_create_request: ConversationCreateRequest
    ) -> ConversationCreateResponse:
        id = self._repository.store_conversation("New chat")
        return ConversationCreateResponse(
            id=id,
            assistant_response=self.send_message(id, conversation_create_request),
        )

    def send_message(self, id: str, send_message_request: SendMessageRequest) -> str:
        client = ollama.Client(host=settings.ollama_url)

        client.pull(send_message_request.language_model)

        conversation_history = self._repository.retrieve_dialogue(id).messages
        user_message = {"role": "user", "content": send_message_request.message}
        conversation_history.append(user_message)

        response = client.chat(
            model=send_message_request.language_model,
            messages=conversation_history,
            keep_alive=0,
        )

        reply = response.message.content or ""
        assistant_response = {"role": "assistant", "content": reply}

        self._repository.add_user_chatbot_interaction(
            id, user_message, assistant_response
        )

        return reply

    def retrieve_all_conversations_metadata(self) -> list[ConversationRetrieve]:
        return self._repository.retrieve_all_conversations_metadata()

    def retrieve_dialogue(self, id: str) -> DialogueRetrieve:
        return self._repository.retrieve_dialogue(id)

    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest
    ):
        return self._repository.update_conversation_metadata(id, metadata)

    def delete_conversation(self, id: str) -> None:
        return self._repository.delete_conversation(id)
