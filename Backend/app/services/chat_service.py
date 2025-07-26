import ollama
from ..core.settings import settings
from ..utils.singleton_meta import SingletonMeta


class ChatService(metaclass=SingletonMeta):
    def __init__(self) -> None:
        self._conversation_history: list[dict] = []
        self._model = "llama3.2"

    def send_message(self, message: str) -> str:
        client = ollama.Client(host=settings.ollama_url)

        client.pull(self._model)

        self._conversation_history.append({"role": "user", "content": message})
        response = client.chat(
            model=self._model,
            messages=self._conversation_history,
            keep_alive=0,
        )

        reply = response.message.content or ""
        self._conversation_history.append({"role": "assistant", "content": reply})

        return reply
