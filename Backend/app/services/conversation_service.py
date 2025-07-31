import ollama

from ..core.settings import settings
from ..database.repositories.conversation_repo import ConversationRepository
from ..schemas.conversation_schema import (
    ConversationCreate,
    ConversationRetrieve,
    DialogueRetrieve,
    UserChatbotInteraction,
)
from ..utils.singleton_meta import SingletonMeta


class ConversationService(metaclass=SingletonMeta):
    def __init__(self) -> None:
        self._conversation_history: list[dict] = []
        self._model = "llama3.2"

        self._repository = ConversationRepository()
        self._conversation_id = self._repository.create_conversation(
            ConversationCreate(title="my conversation")
        )

    def send_message(self, message: str):
        client = ollama.Client(host=settings.ollama_url)

        client.pull(self._model)

        user_message = {"role": "user", "content": message}
        self._conversation_history.append(user_message)

        response = client.chat(
            model=self._model,
            messages=self._conversation_history,
            keep_alive=0,
        )

        reply = response.message.content or ""
        assistant_response = {"role": "assistant", "content": reply}
        self._conversation_history.append(assistant_response)

        self._repository.add_user_chatbot_interaction(
            self._conversation_id,
            UserChatbotInteraction(
                user_message=user_message, assistant_response=assistant_response
            ),
        )

        return reply

    def retrieve_all_conversations_metadata(self) -> list[ConversationRetrieve]:
        return self._repository.retrieve_all_conversations_metadata()

    def retrieve_dialogue(self, id: str) -> DialogueRetrieve:
        return self._repository.retrieve_dialogue(id)

    def delete_conversation(self, id: str) -> None:
        return self._repository.delete_conversation(id)