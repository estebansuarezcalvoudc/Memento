import asyncio
from datetime import datetime

import chromadb
import dateparser.search
from chromadb.errors import NotFoundError as ChromaNotFoundError
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_core.documents import Document
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_openai import ChatOpenAI

from ...core.encryption import decrypt_api_key
from ...core.logging import setup_logger
from ...core.settings import settings
from ...repositories.interfaces.conversation_repo import ConversationRepository
from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.conversation.conversation_schema import (
    ConversationCreateRequest,
    ConversationCreateResponse,
    ConversationDialogueRetrieve,
    ConversationMetadataRetrieve,
    ConversationUpdateRequest,
    SendMessageRequest,
)
from ...schemas.conversation.language_models_schema import LanguageModelConfiguration
from ...utils.singleton_meta import SingletonMeta

_logger = setup_logger(__name__)

_CONTEXTUALIZE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "Given the conversation history and the latest user question, "
                "reformulate it as a standalone question that can be understood without the history. "
                "If the question contains relative time references (e.g. 'today', 'yesterday', 'this week'), "
                "resolve them to exact dates using the current date: {current_date}. "
                "Do NOT answer it, just reformulate it if needed, otherwise return it as is."
            ),
        ),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

_QA_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are a helpful assistant with access to the user's meeting notes. "
                "Use the retrieved meeting context below to answer the question. "
                "When the context contains relevant information, present it directly and completely without asking for confirmation. "
                "If the context contains no meetings matching what the user asked, say so clearly. "
                "If the context is not relevant, answer based on your general knowledge.\n\n"
                "Context:\n{context}"
            ),
        ),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)


def _format_docs(docs: list[Document]) -> str:
    parts = []
    for doc in docs:
        meta = doc.metadata
        header_parts = []
        if title := meta.get("title"):
            header_parts.append(f"Title: {title}")
        if date := meta.get("date"):
            header_parts.append(f"Date: {date}")
        header = "\n".join(header_parts)
        parts.append(f"{header}\n{doc.page_content}" if header else doc.page_content)
    return "\n\n".join(parts)


class ConversationService(metaclass=SingletonMeta):
    def __init__(self, repository: ConversationRepository, settings_repository: SettingsRepository) -> None:
        self._repository: ConversationRepository = repository
        self._settings_repository: SettingsRepository = settings_repository
        self._embeddings = OllamaEmbeddings(
            base_url=settings.ollama_url,
            model=settings.rag_embedding_model,
        )
        self._chroma_client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
        self._vector_store = self._create_vector_store()

    def _create_vector_store(self) -> Chroma:
        return Chroma(
            client=self._chroma_client,
            collection_name=settings.rag_collection_name,
            embedding_function=self._embeddings,
        )

    def _get_vector_store(self) -> Chroma:
        try:
            self._vector_store._collection.count()
        except ChromaNotFoundError:
            _logger.warning("ChromaDB collection reference stale, reconnecting...")
            self._vector_store = self._create_vector_store()
        return self._vector_store

    def _resolve_chat_model(self, username: str) -> LanguageModelConfiguration:
        """Load chat model from user settings, falling back to defaults."""
        model_settings = self._settings_repository.get_model_settings(username)
        if model_settings and (chat_model := model_settings.get("chat_model")):
            return LanguageModelConfiguration(
                provider=chat_model["provider"],
                model=chat_model["model_name"],
                options={
                    "temperature": chat_model.get("temperature", 0.2),
                    "max_tokens": chat_model.get("max_tokens", 2000),
                },
            )
        return LanguageModelConfiguration()

    def _build_llm(
        self, llm_config: LanguageModelConfiguration, username: str
    ) -> BaseChatModel:
        _logger.info(f"Creating model {llm_config.model}")

        options = llm_config.options.copy()
        temperature = options.pop("temperature")
        max_tokens = options.pop("max_tokens")

        if llm_config.provider.value == "Ollama":
            return ChatOllama(
                base_url=settings.ollama_url,
                model=llm_config.model,
                temperature=temperature,
                num_predict=max_tokens,
            )

        provider_settings = self._settings_repository.get_provider_settings(username, "OpenAI")
        if not provider_settings or not provider_settings.api_key_encrypted:
            raise RuntimeError(f"OpenAI API key not configured for user {username}")
        api_key = decrypt_api_key(provider_settings.api_key_encrypted)
        return ChatOpenAI(
            api_key=api_key,
            model=llm_config.model,
            temperature=temperature,
            max_tokens=max_tokens,
            model_kwargs=options,
        )

    def _build_rag_chain(self, llm_config: LanguageModelConfiguration, username: str):
        llm = self._build_llm(llm_config, username)

        contextualize_chain = _CONTEXTUALIZE_PROMPT | llm | StrOutputParser()

        def contextualize_if_needed(input: dict) -> dict:
            current_date = input.get("current_date", "")
            if input.get("chat_history"):
                query = contextualize_chain.invoke(input)
            elif current_date:
                query = contextualize_chain.invoke({**input, "chat_history": []})
            else:
                query = input["input"]
            _logger.debug(f"RAG query: {query}")
            return {"query": query, "current_date": current_date}

        def retrieve_with_date_filter(input: dict) -> list[Document]:
            query = input["query"]
            current_date_str = input.get("current_date", "")

            relative_base = (
                datetime.strptime(current_date_str, "%Y-%m-%d")
                if current_date_str
                else None
            )
            dateparser_settings = {"PREFER_DAY_OF_MONTH": "first"}
            if relative_base:
                dateparser_settings["RELATIVE_BASE"] = relative_base

            chroma_filter: dict
            matches = dateparser.search.search_dates(query, settings=dateparser_settings)
            if matches:
                date_str = matches[0][1].strftime("%Y-%m-%d")
                _logger.debug(f"Date filter applied: {date_str}")
                chroma_filter = {"$and": [{"username": {"$eq": username}}, {"date": {"$eq": date_str}}]}
            else:
                chroma_filter = {"username": {"$eq": username}}

            return self._get_vector_store().similarity_search(query, k=5, filter=chroma_filter)

        return (
            RunnablePassthrough.assign(
                context=RunnableLambda(contextualize_if_needed)
                | RunnableLambda(retrieve_with_date_filter)
                | _format_docs
            )
            | _QA_PROMPT
            | llm
            | StrOutputParser()
        )

    async def create_conversation(
        self, conversation_create_request: ConversationCreateRequest, username: str
    ) -> ConversationCreateResponse:
        created_conversation = self._repository.store_conversation(
            "New chat", username, []
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

            chat_history = [
                (
                    HumanMessage(content=m["content"])
                    if m["role"] == "user"
                    else AIMessage(content=m["content"])
                )
                for m in conversation_history[:-1]
                if m.get("role") in ("user", "assistant") and m.get("content")
            ]

            llm_config = self._resolve_chat_model(username)
            rag_chain = self._build_rag_chain(llm_config, username)
            reply = await rag_chain.ainvoke(
                {
                    "input": send_message_request.message,
                    "chat_history": chat_history,
                    "current_date": send_message_request.current_datetime.strftime("%Y-%m-%d"),
                }
            )

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
        return self._repository.fetch_conversation(id, username)

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
                if message.get("content"):
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
