"""
Unit tests for Rag service: LLM selection logic, static helpers, and error paths.
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from langchain_core.documents import Document

from app.core.llm_factory import get_llm_for_user
from app.schemas.settings.model_schema import ModelConfig
from app.schemas.settings.provider_schema import ProviderSettings
from app.services.conversation.rag import Rag


class TestBuildRagChain:
    def test_build_rag_chain_should_use_different_llms_for_retrieval_and_chat(self):
        mock_repo = MagicMock()

        # OpenAI returns provider settings with an API key; Ollama has no DB entry (None)
        def mock_get_provider_settings(username, provider_name):
            if provider_name == "OpenAI":
                return ProviderSettings(
                    requires_api_key=True,
                    api_key_encrypted="encrypted-key",
                )
            return None  # Ollama has no entry in DB

        mock_repo.get_provider_settings.side_effect = mock_get_provider_settings

        rag = Rag(settings_repository=mock_repo, vector_store=MagicMock())

        chat_config = ModelConfig(
            provider="OpenAI",
            model_name="gpt-4o",
            temperature=0.7,
            max_tokens=2000,
        )
        retrieval_config = ModelConfig(
            provider="Ollama",
            model_name="llama3.1",
            temperature=0.2,
            max_tokens=1000,
        )

        with patch("app.services.conversation.rag.get_llm_for_user") as mock_factory:
            mock_factory.return_value = MagicMock()

            rag._build_rag_chain(chat_config, retrieval_config, "test@example.com")

            assert mock_factory.call_count == 2
            first_call_config = mock_factory.call_args_list[0][0][0]
            second_call_config = mock_factory.call_args_list[1][0][0]
            assert first_call_config == chat_config
            assert second_call_config == retrieval_config


class TestGetLlm:
    def test_get_llm_should_raise_http_exception_when_api_key_required_but_missing(
        self,
    ):
        mock_repo = MagicMock()
        mock_repo.get_provider_settings.return_value = None  # no settings stored

        rag = Rag(settings_repository=mock_repo, vector_store=MagicMock())

        config = ModelConfig(
            provider="OpenAI",
            model_name="gpt-4o",
            temperature=0.7,
            max_tokens=2000,
        )

        with pytest.raises(HTTPException) as exc_info:
            get_llm_for_user(config, rag._settings_repository, "user123")

        assert exc_info.value.status_code == 400
        assert "API key not configured" in exc_info.value.detail

    def test_get_llm_should_succeed_for_ollama_without_api_key(self):
        mock_repo = MagicMock()
        mock_repo.get_provider_settings.return_value = None  # Ollama has no DB entry

        rag = Rag(settings_repository=mock_repo, vector_store=MagicMock())

        config = ModelConfig(
            provider="Ollama",
            model_name="llama3.2:latest",
            temperature=0.7,
            max_tokens=2000,
        )

        with patch("app.core.llm_factory.ChatOllama") as mock_ollama_cls:
            mock_ollama_cls.return_value = MagicMock()
            result = get_llm_for_user(config, rag._settings_repository, "user123")

        mock_ollama_cls.assert_called_once()
        assert result is not None


class TestBuildChromaFilter:
    def test_build_chroma_filter_should_include_only_user_id_when_no_date(self):
        result = Rag._build_chroma_filter("user42", None)
        assert result == {"user_id": {"$eq": "user42"}}

    def test_build_chroma_filter_should_include_date_filter_when_date_provided(self):
        result = Rag._build_chroma_filter("user42", "2024-03-15")
        assert result == {
            "$and": [
                {"user_id": {"$eq": "user42"}},
                {"date": {"$eq": "2024-03-15"}},
            ]
        }


class TestBuildDateparserSettings:
    def test_build_dateparser_settings_should_not_include_relative_base_when_none(self):
        result = Rag._build_dateparser_settings(None)
        assert result == {"PREFER_DAY_OF_MONTH": "first"}
        assert "RELATIVE_BASE" not in result

    def test_build_dateparser_settings_should_include_relative_base_when_provided(self):
        base = datetime(2024, 6, 15)
        result = Rag._build_dateparser_settings(base)
        assert result["PREFER_DAY_OF_MONTH"] == "first"
        assert result["RELATIVE_BASE"] == base


class TestFormatDocs:
    def test_format_docs_should_return_empty_string_for_empty_list(self):
        assert Rag._format_docs([]) == ""

    def test_format_docs_should_include_title_and_date_when_present(self):
        doc = Document(
            page_content="We discussed Q1 targets.",
            metadata={"title": "Q1 Meeting", "date": "2024-01-15"},
        )
        result = Rag._format_docs([doc])
        assert "Title: Q1 Meeting" in result
        assert "Date: 2024-01-15" in result
        assert "We discussed Q1 targets." in result

    def test_format_docs_should_omit_header_when_no_metadata(self):
        doc = Document(page_content="Plain content.", metadata={})
        result = Rag._format_docs([doc])
        assert result == "Plain content."

    def test_format_docs_should_separate_multiple_docs_with_double_newline(self):
        docs = [
            Document(page_content="First doc.", metadata={}),
            Document(page_content="Second doc.", metadata={}),
        ]
        result = Rag._format_docs(docs)
        assert result == "First doc.\n\nSecond doc."


class TestGenerateTitle:
    @pytest.mark.asyncio
    async def test_generate_title_should_strip_think_block_from_model_response(self):
        mock_repo = MagicMock()
        mock_repo.get_chat_model.return_value = ModelConfig(
            provider="Ollama",
            model_name="qwen3.5",
            temperature=0.1,
            max_tokens=50,
        )

        rag = Rag(settings_repository=mock_repo, vector_store=MagicMock())

        llm = MagicMock()
        llm.ainvoke = AsyncMock(
            return_value=MagicMock(content="<think>hidden</think>My Title")
        )

        with patch("app.services.conversation.rag.get_llm_for_user", return_value=llm):
            title = await rag.generate_title("hello", "user123")

        assert title == "My Title"

    @pytest.mark.asyncio
    async def test_generate_title_should_fallback_to_new_chat_when_only_unclosed_think(
        self,
    ):
        mock_repo = MagicMock()
        mock_repo.get_chat_model.return_value = ModelConfig(
            provider="Ollama",
            model_name="qwen3.5",
            temperature=0.1,
            max_tokens=50,
        )

        rag = Rag(settings_repository=mock_repo, vector_store=MagicMock())

        llm = MagicMock()
        llm.ainvoke = AsyncMock(return_value=MagicMock(content="<think>hidden"))

        with patch("app.services.conversation.rag.get_llm_for_user", return_value=llm):
            title = await rag.generate_title("hello", "user123")

        assert title == "New chat"

    @pytest.mark.asyncio
    async def test_generate_title_should_strip_thinking_block_from_model_response(
        self,
    ):
        mock_repo = MagicMock()
        mock_repo.get_chat_model.return_value = ModelConfig(
            provider="Ollama",
            model_name="qwen3.5",
            temperature=0.1,
            max_tokens=50,
        )

        rag = Rag(settings_repository=mock_repo, vector_store=MagicMock())

        llm = MagicMock()
        llm.ainvoke = AsyncMock(
            return_value=MagicMock(content="<thinking>hidden</thinking>Title")
        )

        with patch("app.services.conversation.rag.get_llm_for_user", return_value=llm):
            title = await rag.generate_title("hello", "user123")

        assert title == "Title"
