from datetime import datetime

import dateparser.search
from fastapi import HTTPException, status
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.vectorstores import VectorStore

from app.core.language_model_factory import language_model_factory

from ...core.logging import setup_logger
from ...core.providers_config import AVAILABLE_PROVIDERS
from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.settings.model_schema import ModelConfig
from .rag_prompts import CONTEXTUALIZE_PROMPT, QA_PROMPT

_logger = setup_logger(__name__)


class Rag:
    def __init__(
        self,
        settings_repository: SettingsRepository,
        vector_store: VectorStore,
    ) -> None:
        self._settings_repository = settings_repository
        self._vector_store = vector_store

    async def get_reply(
        self,
        message: str,
        conversation_history: list[dict],
        current_date: str,
        username: str,
    ) -> str:
        chat_history = [
            (
                HumanMessage(content=m["content"])
                if m["role"] == "user"
                else AIMessage(content=m["content"])
            )
            for m in conversation_history
            if m.get("role") in ("user", "assistant") and m.get("content")
        ]

        chat_config = self._settings_repository.get_chat_model(username)
        retrieval_config = self._settings_repository.get_retrieval_model(username)

        _logger.info(
            f"Chat model:      provider={chat_config.provider!r}  "
            f"model={chat_config.model_name!r}"
        )
        _logger.info(
            f"Retrieval model: provider={retrieval_config.provider!r}  "
            f"model={retrieval_config.model_name!r}"
        )

        rag_chain = self._build_rag_chain(chat_config, retrieval_config, username)
        return await rag_chain.ainvoke(
            {
                "input": message,
                "chat_history": chat_history,
                "current_date": current_date,
            }
        )

    def _get_llm(self, llm_config: ModelConfig, username: str):
        """Resolve provider settings and instantiate an LLM for the given config."""
        provider_settings = self._settings_repository.get_provider_settings(
            username, llm_config.provider
        )

        _logger.debug(
            f"_get_llm: provider={llm_config.provider!r} "
            f"provider_settings={provider_settings!r}"
        )

        requires_api_key = AVAILABLE_PROVIDERS.get(llm_config.provider, {}).get(
            "requires_api_key", True
        )
        if requires_api_key and (
            provider_settings is None or not provider_settings.api_key_encrypted
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"API key not configured for user {username}",
            )

        api_key = provider_settings.api_key_encrypted if provider_settings else ""
        return language_model_factory(llm_config, api_key or "")

    def _build_rag_chain(
        self,
        chat_config: ModelConfig,
        retrieval_config: ModelConfig,
        username: str,
    ):
        llm_chat = self._get_llm(chat_config, username)
        llm_retrieval = self._get_llm(retrieval_config, username)

        contextualize_chain = CONTEXTUALIZE_PROMPT | llm_retrieval | StrOutputParser()

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
            dateparser_settings = Rag._build_dateparser_settings(relative_base)
            matches = dateparser.search.search_dates(
                query, settings=dateparser_settings
            )

            date_str: str | None = None
            if matches:
                date_str = matches[0][1].strftime("%Y-%m-%d")
                _logger.debug(f"Date filter applied: {date_str}")

            chroma_filter = Rag._build_chroma_filter(username, date_str)
            return self._vector_store.similarity_search(
                query, k=5, filter=chroma_filter
            )

        return (
            RunnablePassthrough.assign(
                context=RunnableLambda(contextualize_if_needed)
                | RunnableLambda(retrieve_with_date_filter)
                | Rag._format_docs
            )
            | QA_PROMPT
            | llm_chat
            | StrOutputParser()
        )

    @staticmethod
    def _build_dateparser_settings(relative_base: datetime | None) -> dict:
        settings: dict = {"PREFER_DAY_OF_MONTH": "first"}
        if relative_base:
            settings["RELATIVE_BASE"] = relative_base
        return settings

    @staticmethod
    def _build_chroma_filter(username: str, date_str: str | None) -> dict:
        if date_str:
            return {
                "$and": [
                    {"username": {"$eq": username}},
                    {"date": {"$eq": date_str}},
                ]
            }
        return {"username": {"$eq": username}}

    @staticmethod
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
            parts.append(
                f"{header}\n{doc.page_content}" if header else doc.page_content
            )
        return "\n\n".join(parts)
