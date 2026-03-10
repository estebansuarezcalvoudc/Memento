"""
Unit tests for core/providers_config.py
"""

from unittest.mock import MagicMock, patch

import pytest

from app.schemas.settings.model_schema import ModelConfig


class TestListModels:
    def test_list_models_should_return_ollama_model_names(self):
        mock_model_1 = MagicMock()
        mock_model_1.model = "llama3.2:latest"
        mock_model_2 = MagicMock()
        mock_model_2.model = "mistral:latest"

        with patch("app.core.providers_config.ollama.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client_cls.return_value = mock_client
            mock_client.list.return_value = MagicMock(
                models=[mock_model_1, mock_model_2]
            )

            from app.core.providers_config import list_models

            result = list_models("Ollama")

        assert result == ["llama3.2:latest", "mistral:latest"]

    def test_list_models_should_return_openai_llm_model_ids(self):
        mock_gpt4 = MagicMock()
        mock_gpt4.id = "gpt-4o"
        mock_embedding = MagicMock()
        mock_embedding.id = "text-embedding-3-small"  # not an LLM — should be filtered
        mock_gpt35 = MagicMock()
        mock_gpt35.id = "gpt-3.5-turbo"

        with patch("app.core.providers_config.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.models.list.return_value = MagicMock(
                data=[mock_gpt4, mock_embedding, mock_gpt35]
            )

            # Must patch decrypt since the encrypted key is just a placeholder here
            with patch(
                "app.core.providers_config.decrypt_api_key",
                return_value="sk-plain-key",
            ):
                from app.core.providers_config import list_models

                result = list_models("OpenAI", api_key_encrypted="encrypted-key")

        assert "gpt-4o" in result
        assert "gpt-3.5-turbo" in result
        assert "text-embedding-3-small" not in result


class TestCreateLlm:
    def test_create_llm_should_return_chat_ollama_for_ollama_provider(self):
        config = ModelConfig(
            provider="Ollama",
            model_name="llama3.2:latest",
            temperature=0.7,
            max_tokens=2000,
        )

        with patch("app.core.providers_config.ChatOllama") as mock_ollama_cls:
            mock_ollama_cls.return_value = MagicMock()

            from app.core.providers_config import create_llm

            result = create_llm(config)

        mock_ollama_cls.assert_called_once()
        call_kwargs = mock_ollama_cls.call_args.kwargs
        assert call_kwargs["model"] == "llama3.2:latest"
        assert call_kwargs["temperature"] == 0.7
        assert call_kwargs["num_predict"] == 2000

    def test_create_llm_should_return_chat_openai_for_openai_provider(self):
        config = ModelConfig(
            provider="OpenAI",
            model_name="gpt-4o",
            temperature=0.5,
            max_tokens=1000,
        )

        with patch(
            "app.core.providers_config.decrypt_api_key", return_value="sk-plain"
        ):
            with patch("app.core.providers_config.ChatOpenAI") as mock_openai_cls:
                mock_openai_cls.return_value = MagicMock()

                from app.core.providers_config import create_llm

                result = create_llm(config, api_key_encrypted="encrypted-key")

        mock_openai_cls.assert_called_once()
        call_kwargs = mock_openai_cls.call_args.kwargs
        assert call_kwargs["model"] == "gpt-4o"
        assert call_kwargs["temperature"] == 0.5
        assert call_kwargs["max_tokens"] == 1000
        assert call_kwargs["api_key"] == "sk-plain"
