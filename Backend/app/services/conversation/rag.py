from collections.abc import AsyncGenerator
from datetime import datetime

import dateparser.search
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.vectorstores import VectorStore

from app.core.llm_factory import get_llm_for_user

from ...core.logging import setup_logger
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

    def _build_chat_history(self, conversation_history: list[dict]) -> list:
        return [
            (
                HumanMessage(content=m["content"])
                if m["role"] == "user"
                else AIMessage(content=m["content"])
            )
            for m in conversation_history
            if m.get("role") in ("user", "assistant") and m.get("content")
        ]

    def _log_model_configs(
        self, chat_config: ModelConfig, retrieval_config: ModelConfig
    ) -> None:
        _logger.info(
            f"Chat model:      provider={chat_config.provider!r}  "
            f"model={chat_config.model_name!r}"
        )
        _logger.info(
            f"Retrieval model: provider={retrieval_config.provider!r}  "
            f"model={retrieval_config.model_name!r}"
        )

    async def get_reply(
        self,
        message: str,
        conversation_history: list[dict],
        current_date: str,
        user_id: str,
    ) -> str:
        chat_history = self._build_chat_history(conversation_history)
        chat_config = self._settings_repository.get_chat_model(user_id)
        retrieval_config = self._settings_repository.get_retrieval_model(user_id)
        self._log_model_configs(chat_config, retrieval_config)

        rag_chain = self._build_rag_chain(chat_config, retrieval_config, user_id)
        return await rag_chain.ainvoke(
            {
                "input": message,
                "chat_history": chat_history,
                "current_date": current_date,
            }
        )

    async def retrieve_context(
        self,
        message: str,
        conversation_history: list[dict],
        current_date: str,
        user_id: str,
    ) -> str:
        """Run the retrieval pipeline and return the formatted context string."""
        chat_history = self._build_chat_history(conversation_history)
        retrieval_config = self._settings_repository.get_retrieval_model(user_id)
        llm_retrieval = get_llm_for_user(
            retrieval_config, self._settings_repository, user_id
        )
        retrieval_chain = self._build_retrieval_chain(llm_retrieval, user_id)
        return await retrieval_chain.ainvoke(
            {
                "input": message,
                "chat_history": chat_history,
                "current_date": current_date,
            }
        )

    async def stream_reply(
        self,
        message: str,
        conversation_history: list[dict],
        context: str,
        current_date: str,
        user_id: str,
    ) -> AsyncGenerator[str, None]:
        """Stream LLM tokens given pre-fetched context."""
        chat_history = self._build_chat_history(conversation_history)
        chat_config = self._settings_repository.get_chat_model(user_id)
        llm_chat = get_llm_for_user(chat_config, self._settings_repository, user_id)

        qa_chain = QA_PROMPT | llm_chat
        async for chunk in qa_chain.astream(
            {
                "input": message,
                "chat_history": chat_history,
                "context": context,
                "current_date": current_date,
            }
        ):
            if chunk.content:
                yield chunk.content

    async def generate_title(self, message: str, user_id: str) -> str:
        """Generate a short chat title from the first user message.

        Uses the user's configured chat model with a minimal prompt.
        Returns 'New chat' silently if generation fails for any reason.
        """
        try:
            chat_config = self._settings_repository.get_chat_model(user_id)
            llm = get_llm_for_user(chat_config, self._settings_repository, user_id)
            prompt = (
                "Generate a concise chat title (3 to 6 words) for a conversation "
                "that starts with the following message. Reply with only the title, "
                "no quotes, no punctuation at the end.\n\n"
                f"Message: {message}"
            )
            result = await llm.ainvoke(prompt)
            title = (
                result.content.strip()
                if hasattr(result, "content")
                else str(result).strip()
            )
            return title if title else "New chat"
        except Exception:
            _logger.warning(
                "Title generation failed, keeping default title", exc_info=True
            )
            return "New chat"

    async def get_reply_stream(
        self,
        message: str,
        conversation_history: list[dict],
        current_date: str,
        user_id: str,
    ) -> AsyncGenerator[str, None]:
        """Convenience wrapper: retrieve context then stream tokens."""
        chat_config = self._settings_repository.get_chat_model(user_id)
        retrieval_config = self._settings_repository.get_retrieval_model(user_id)
        self._log_model_configs(chat_config, retrieval_config)

        context = await self.retrieve_context(
            message, conversation_history, current_date, user_id
        )
        async for token in self.stream_reply(
            message, conversation_history, context, current_date, user_id
        ):
            yield token

    def _build_retrieval_chain(self, llm_retrieval, user_id: str):
        """Returns a chain that resolves the query and retrieves formatted context."""
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

            chroma_filter = Rag._build_chroma_filter(user_id, date_str)
            return self._vector_store.similarity_search(
                query, k=5, filter=chroma_filter
            )

        return (
            RunnableLambda(contextualize_if_needed)
            | RunnableLambda(retrieve_with_date_filter)
            | Rag._format_docs
        )

    def _build_rag_chain(
        self,
        chat_config: ModelConfig,
        retrieval_config: ModelConfig,
        user_id: str,
    ):
        llm_chat = get_llm_for_user(chat_config, self._settings_repository, user_id)
        llm_retrieval = get_llm_for_user(
            retrieval_config, self._settings_repository, user_id
        )
        retrieval_chain = self._build_retrieval_chain(llm_retrieval, user_id)

        return (
            RunnablePassthrough.assign(context=retrieval_chain)
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
    def _build_chroma_filter(user_id: str, date_str: str | None) -> dict:
        if date_str:
            return {
                "$and": [
                    {"user_id": {"$eq": user_id}},
                    {"date": {"$eq": date_str}},
                ]
            }
        return {"user_id": {"$eq": user_id}}

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
