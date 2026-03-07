"""
Unit tests for Rag service: LLM selection logic.
"""

from unittest.mock import MagicMock, patch

from app.schemas.conversation.language_models_schema import (
    LanguageModelConfiguration,
    ProviderType,
)
from app.schemas.settings.provider_schema import ProviderSettings
from app.services.conversation.rag import Rag


class TestBuildRagChain:
    def test_build_rag_chain_should_use_different_llms_for_retrieval_and_chat(self):
        mock_repo = MagicMock()
        mock_repo.get_provider_settings.return_value = ProviderSettings(
            requires_api_key=False,
            active=True,
        )

        rag = Rag(settings_repository=mock_repo, vector_store=MagicMock())

        chat_config = LanguageModelConfiguration(
            provider=ProviderType.OPENAI,
            model="gpt-4o",
            options={"temperature": 0.7, "max_tokens": 2000},
        )
        retrieval_config = LanguageModelConfiguration(
            provider=ProviderType.OLLAMA,
            model="llama3.1",
            options={"temperature": 0.2, "max_tokens": 1000},
        )

        with patch(
            "app.services.conversation.rag.language_model_factory"
        ) as mock_factory:
            mock_factory.return_value = MagicMock()

            rag._build_rag_chain(chat_config, retrieval_config, "test@example.com")

            assert mock_factory.call_count == 2
            first_call_config = mock_factory.call_args_list[0][0][0]
            second_call_config = mock_factory.call_args_list[1][0][0]
            assert first_call_config == chat_config
            assert second_call_config == retrieval_config
