import os
from unittest.mock import MagicMock, patch

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

from app.core.encryption import encrypt_api_key
from app.services.settings.transcription_providers_service import (
    TranscriptionProvidersService,
)


def _make_service(active_provider: str | None = "whisperx", has_aai_key: bool = False):
    repo = MagicMock()
    repo.get_transcription_active_provider.return_value = active_provider
    encrypted_aai_key = encrypt_api_key("aai-key") if has_aai_key else None
    repo.get_transcription_provider_api_key_encrypted.side_effect = (
        lambda _user_id, provider_name: (
            encrypted_aai_key if provider_name == "aai" and encrypted_aai_key else None
        )
    )
    return TranscriptionProvidersService(repo), repo


class TestTranscriptionProvidersService:
    def test_get_providers_should_return_all_with_active_and_api_key_flags(self):
        service, _repo = _make_service(active_provider="whisperx", has_aai_key=True)

        providers = service.get_providers("user123")

        assert len(providers) == 2
        whisperx = next(p for p in providers if p.name == "whisperx")
        assert whisperx.is_active is True
        assert whisperx.requires_api_key is False
        assert whisperx.has_api_key is None

        aai = next(p for p in providers if p.name == "aai")
        assert aai.is_active is False
        assert aai.requires_api_key is True
        assert aai.has_api_key is True

    def test_get_providers_should_fallback_to_whisperx_when_active_missing(self):
        service, repo = _make_service(active_provider=None, has_aai_key=False)

        providers = service.get_providers("user123")

        whisperx = next(p for p in providers if p.name == "whisperx")
        assert whisperx.is_active is True
        repo.set_transcription_active_provider.assert_called_once_with(
            "user123", "whisperx"
        )

    def test_set_active_provider_should_require_api_key_for_aai(self):
        service, repo = _make_service(active_provider="whisperx", has_aai_key=False)

        with pytest.raises(HTTPException) as exc_info:
            service.set_active_provider("user123", "aai")

        assert exc_info.value.status_code == 400
        repo.set_transcription_active_provider.assert_not_called()

    def test_set_active_provider_should_succeed_for_aai_with_api_key(self):
        service, repo = _make_service(active_provider="whisperx", has_aai_key=True)

        service.set_active_provider("user123", "aai")

        repo.set_transcription_active_provider.assert_called_once_with("user123", "aai")

    def test_set_active_provider_should_fail_for_invalid_provider(self):
        service, repo = _make_service(active_provider="whisperx", has_aai_key=True)

        with pytest.raises(HTTPException) as exc_info:
            service.set_active_provider("user123", "invalid")

        assert exc_info.value.status_code == 400
        repo.set_transcription_active_provider.assert_not_called()

    def test_add_provider_api_key_should_validate_and_persist(self):
        service, repo = _make_service(active_provider="whisperx", has_aai_key=False)

        mock_transcription_service = MagicMock()
        with patch(
            "app.services.settings.transcription_providers_service.create_transcription_service",
            return_value=mock_transcription_service,
        ):
            service.add_provider_api_key("user123", "aai", "aai-key")

        mock_transcription_service.validate_api_key.assert_called_once_with("aai-key")
        repo.save_transcription_provider_api_key_encrypted.assert_called_once()

    def test_get_transcription_service_for_user_should_resolve_active_service(self):
        service, repo = _make_service(active_provider="whisperx", has_aai_key=False)

        with patch(
            "app.services.settings.transcription_providers_service.create_transcription_service"
        ) as create_service:
            create_service.return_value = MagicMock()
            service.get_transcription_service_for_user("user123")

        create_service.assert_called_once_with("whisperx", repo)
