"""
Unit tests for core/providers_config.py and core/llm_factory.py
"""

from unittest.mock import MagicMock, patch

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


class TestCreateLlm:
    def test_create_llm_should_return_chat_ollama_for_ollama_provider(self):
        config = ModelConfig(
            provider="Ollama",
            model_name="llama3.2:latest",
            temperature=0.7,
            max_tokens=2000,
        )

        with patch("app.core.llm_factory.ChatOllama") as mock_ollama_cls:
            mock_ollama_cls.return_value = MagicMock()

            from app.core.llm_factory import create_llm

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

        with patch("app.core.llm_factory.decrypt_api_key", return_value="sk-plain"):
            with patch("app.core.llm_factory.ChatOpenAI") as mock_openai_cls:
                mock_openai_cls.return_value = MagicMock()

                from app.core.llm_factory import create_llm

                result = create_llm(config, api_key_encrypted="encrypted-key")

        mock_openai_cls.assert_called_once()
        call_kwargs = mock_openai_cls.call_args.kwargs
        assert call_kwargs["model"] == "gpt-4o"
        assert call_kwargs["temperature"] == 0.5
        from pydantic import SecretStr

        assert call_kwargs["max_tokens"] == 1000
        assert call_kwargs["api_key"] == SecretStr("sk-plain")
