import os
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import assemblyai as aai
import pytest
from fastapi import HTTPException

os.environ.setdefault("ENCRYPTION_KEY", "obiWVK9qLu_vz-2Kr540yaKuxxa2exJprn2THT2u6U0=")
os.environ.setdefault("MONGO_USER", "test_user")
os.environ.setdefault("MONGO_PASSWORD", "test_password")
os.environ.setdefault("MONGO_HOST", "localhost")
os.environ.setdefault("MONGO_PORT", "27017")
os.environ.setdefault("SECRET_KEY", "test_secret_key_for_jwt_tokens")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("OPENAI_KEY", "sk-test-key")
os.environ.setdefault("HF_TOKEN", "test-hf-token")
os.environ.setdefault("OLLAMA_HOST", "localhost")
os.environ.setdefault("OLLAMA_PORT", "11434")
os.environ.setdefault("CHROMA_HOST", "localhost")
os.environ.setdefault("CHROMA_PORT", "8000")
os.environ.setdefault("RAG_EMBEDDING_MODEL", "nomic-embed-text")
os.environ.setdefault("RAG_COLLECTION_NAME", "meetings")

from app.services.transcription.implementations.assemblyai.assemblyai_transcription_service import (
    AssemblyaiTranscriptionService,
)


def _make_service(
    provider_settings: dict | None = None,
    encrypted_api_key: str | None = "encrypted",
):
    repo = MagicMock()
    repo.get_transcription_provider_settings.return_value = provider_settings
    repo.get_transcription_provider_api_key_encrypted.return_value = encrypted_api_key
    service = AssemblyaiTranscriptionService(repo)
    return service, repo


class TestAssemblyAITranscriptionService:
    def test_validate_api_key_should_succeed_for_valid_key(self):
        service, _repo = _make_service()

        with patch("assemblyai.Transcriber") as transcriber_cls:
            transcriber_cls.return_value.transcribe.return_value = MagicMock()

            service.validate_api_key("aai-valid-key")

        transcriber_cls.return_value.transcribe.assert_called_once()

    def test_validate_api_key_should_raise_401_for_invalid_key(self):
        service, _repo = _make_service()

        with patch("assemblyai.Transcriber") as transcriber_cls:
            transcriber_cls.return_value.transcribe.side_effect = Exception("invalid")

            with pytest.raises(HTTPException) as exc_info:
                service.validate_api_key("aai-invalid-key")

        assert exc_info.value.status_code == 401

    def test_get_supported_languages_should_return_language_options_with_name(self):
        service, _repo = _make_service()

        languages = service.get_supported_languages()

        assert len(languages) > 0
        assert all(lang.code for lang in languages)
        assert all(lang.name for lang in languages)

    def test_get_available_options_should_return_speech_models(self):
        service, _repo = _make_service()

        options = service.get_available_options()

        assert len(options.speech_models) > 0
        assert "universal" in options.speech_models

    def test_get_user_configuration_should_return_defaults_when_no_settings(self):
        service, _repo = _make_service(provider_settings=None)

        config = service.get_user_configuration("user123")

        assert config.speech_model == "universal"
        assert config.speaker_labels is True

    def test_get_user_configuration_should_fallback_invalid_speech_model(self):
        service, _repo = _make_service(
            provider_settings={"speech_model": "invalid-model"}
        )

        config = service.get_user_configuration("user123")

        assert config.speech_model == "universal"

    def test_update_user_configuration_should_persist_valid_payload(self):
        service, repo = _make_service(provider_settings={"speech_model": "universal"})

        service.update_user_configuration("user123", {"speech_model": "nano"})

        repo.update_transcription_provider_settings.assert_called_once_with(
            "user123", "aai", {"speech_model": "nano"}
        )

    def test_update_user_configuration_should_raise_422_for_invalid_payload(self):
        service, repo = _make_service()

        with pytest.raises(HTTPException) as exc_info:
            service.update_user_configuration("user123", {"speaker_labels": "invalid"})

        assert exc_info.value.status_code == 422
        repo.update_transcription_provider_settings.assert_not_called()

    def test_transcribe_should_handle_none_utterances(self):
        service, _repo = _make_service(
            provider_settings={"speech_model": "universal", "speaker_labels": True},
            encrypted_api_key="encrypted",
        )

        transcript = SimpleNamespace(
            status=aai.TranscriptStatus.completed,
            error=None,
            utterances=None,
            language_code="en",
        )

        with patch(
            "app.services.transcription.implementations.assemblyai"
            ".assemblyai_transcription_service.decrypt_api_key",
            return_value="plain-key",
        ), patch("assemblyai.Transcriber") as transcriber_cls:
            transcriber_cls.return_value.transcribe.return_value = transcript

            result = service.transcribe(b"audio-bytes", None, "user123")

        args, kwargs = transcriber_cls.return_value.transcribe.call_args
        assert isinstance(args[0], BytesIO)
        assert kwargs.get("config") is not None
        assert result.text == ""
        assert result.language == "en"

    def test_transcribe_should_raise_500_when_provider_returns_error(self):
        service, _repo = _make_service(
            provider_settings={"speech_model": "universal", "speaker_labels": True},
            encrypted_api_key="encrypted",
        )

        transcript = SimpleNamespace(
            status=aai.TranscriptStatus.error,
            error="provider failed",
            utterances=[],
            language_code="en",
        )

        with patch(
            "app.services.transcription.implementations.assemblyai"
            ".assemblyai_transcription_service.decrypt_api_key",
            return_value="plain-key",
        ), patch("assemblyai.Transcriber") as transcriber_cls:
            transcriber_cls.return_value.transcribe.return_value = transcript

            with pytest.raises(HTTPException) as exc_info:
                service.transcribe(b"audio-bytes", None, "user123")

        assert exc_info.value.status_code == 500
