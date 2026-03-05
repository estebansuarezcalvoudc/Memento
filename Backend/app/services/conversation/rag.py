from datetime import datetime

import dateparser.search
from app.core.language_model_factory import language_model_factory
from fastapi import HTTPException, status
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.vectorstores import VectorStore

from ...core.logging import setup_logger
from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.conversation.language_models_schema import LanguageModelConfiguration
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

        llm_config = self._resolve_chat_model(username)
        rag_chain = self._build_rag_chain(llm_config, username)
        return await rag_chain.ainvoke(
            {
                "input": message,
                "chat_history": chat_history,
                "current_date": current_date,
            }
        )

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

    def _build_rag_chain(self, llm_config: LanguageModelConfiguration, username: str):
        provider_settings = self._settings_repository.get_provider_settings(
            username, llm_config.provider.value
        )

        if not provider_settings or not provider_settings.api_key_encrypted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"API key not configured for user {username}",
            )

        llm = language_model_factory(llm_config, provider_settings.api_key_encrypted)

        contextualize_chain = CONTEXTUALIZE_PROMPT | llm | StrOutputParser()

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
            matches = dateparser.search.search_dates(
                query, settings=dateparser_settings
            )
            if matches:
                date_str = matches[0][1].strftime("%Y-%m-%d")
                _logger.debug(f"Date filter applied: {date_str}")
                chroma_filter = {
                    "$and": [
                        {"username": {"$eq": username}},
                        {"date": {"$eq": date_str}},
                    ]
                }
            else:
                chroma_filter = {"username": {"$eq": username}}

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
            | llm
            | StrOutputParser()
        )

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
