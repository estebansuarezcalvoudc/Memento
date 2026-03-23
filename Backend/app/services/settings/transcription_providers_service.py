from fastapi import HTTPException, status

from ...core.encryption import decrypt_api_key, encrypt_api_key
from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.settings.transcription_provider_schema import (
    ActiveTranscriptionProviderResponse,
    TranscriptionProvider,
)
from ..transcription.interfaces.transcription_service import TranscriptionService
from ..transcription.transcription_factory import create_transcription_service

AVAILABLE_TRANSCRIPTION_PROVIDERS: dict[str, dict] = {
    "whisperx": {"requires_api_key": False},
    "aai": {"requires_api_key": True},
}


class TranscriptionProvidersService:
    def __init__(self, repository: SettingsRepository) -> None:
        self._repository = repository

    def get_transcription_service_for_user(self, user_id: str) -> TranscriptionService:
        provider = self.get_active_provider(user_id).provider
        if provider == "aai":
            self._require_provider_api_key(user_id, provider)
        return create_transcription_service(provider, self._repository)

    def get_active_provider(self, user_id: str) -> ActiveTranscriptionProviderResponse:
        active = self._repository.get_transcription_active_provider(user_id)
        if active not in AVAILABLE_TRANSCRIPTION_PROVIDERS:
            active = "whisperx"
            self._repository.set_transcription_active_provider(user_id, active)
        return ActiveTranscriptionProviderResponse(provider=active)

    def get_provider_api_key(self, user_id: str, provider_name: str) -> str | None:
        encrypted_key = self._repository.get_transcription_provider_api_key_encrypted(
            user_id, provider_name
        )
        if not encrypted_key:
            return None
        return decrypt_api_key(encrypted_key)

    def get_providers(self, user_id: str) -> list[TranscriptionProvider]:
        active = self.get_active_provider(user_id).provider
        providers: list[TranscriptionProvider] = []
        for provider_name, cfg in AVAILABLE_TRANSCRIPTION_PROVIDERS.items():
            has_api_key = None
            if cfg["requires_api_key"]:
                has_api_key = bool(
                    self._repository.get_transcription_provider_api_key_encrypted(
                        user_id, provider_name
                    )
                )

            providers.append(
                TranscriptionProvider(
                    name=provider_name,
                    requires_api_key=cfg["requires_api_key"],
                    has_api_key=has_api_key,
                    is_active=provider_name == active,
                )
            )
        return providers

    def set_active_provider(self, user_id: str, provider_name: str) -> None:
        self._validate_provider(provider_name)
        if AVAILABLE_TRANSCRIPTION_PROVIDERS[provider_name]["requires_api_key"]:
            self._require_provider_api_key(user_id, provider_name)
        self._repository.set_transcription_active_provider(user_id, provider_name)

    def add_provider_api_key(
        self, user_id: str, provider_name: str, api_key: str
    ) -> None:
        self._validate_provider(provider_name)
        if not AVAILABLE_TRANSCRIPTION_PROVIDERS[provider_name]["requires_api_key"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider {provider_name} does not require an API key",
            )

        transcription_service = create_transcription_service(
            provider_name, self._repository
        )
        transcription_service.validate_api_key(api_key)
        encrypted_key = encrypt_api_key(api_key)
        self._repository.save_transcription_provider_api_key_encrypted(
            user_id, provider_name, encrypted_key
        )

    def delete_provider_api_key(self, user_id: str, provider_name: str) -> None:
        self._validate_provider(provider_name)
        self._repository.delete_transcription_provider_api_key(user_id, provider_name)

    def _validate_provider(self, provider_name: str) -> None:
        if provider_name not in AVAILABLE_TRANSCRIPTION_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transcription provider: {provider_name}",
            )

    def _require_provider_api_key(self, user_id: str, provider_name: str) -> str:
        api_key = self.get_provider_api_key(user_id, provider_name)
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider {provider_name} requires API key configuration",
            )
        return api_key
