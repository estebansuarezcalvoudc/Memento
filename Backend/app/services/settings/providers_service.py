from collections.abc import Callable

from anthropic import Anthropic
from fastapi import HTTPException, status
from openai import OpenAI

from ...core.encryption import decrypt_api_key, encrypt_api_key
from ...core.logging import setup_logger
from ...core.providers_config import AVAILABLE_PROVIDERS, DEFAULT_USER_SETTINGS
from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.settings.model_schema import ModelConfig
from ...schemas.settings.provider_schema import Provider

_logger = setup_logger(__name__)


class ProvidersService:
    def __init__(self, repository: SettingsRepository) -> None:
        self._repository: SettingsRepository = repository

    def get_providers(self, user_id: str) -> list[Provider]:
        """
        Get all providers with their status

        Args:
            user_id: User's ID

        Returns:
            List of Provider objects
        """
        return self._repository.get_providers(user_id)

    def add_provider_api_key(
        self, user_id: str, provider_name: str, api_key: str
    ) -> None:
        """
        Add and validate API key for a provider

        Args:
            user_id: User's ID
            provider_name: Provider name
            api_key: Plain text API key

        Raises:
            HTTPException: If provider is invalid or API key validation fails
        """
        if provider_name not in AVAILABLE_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider: {provider_name}",
            )

        if not AVAILABLE_PROVIDERS[provider_name]["requires_api_key"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider {provider_name} does not require an API key",
            )

        self._validate_api_key(provider_name, api_key)

        encrypted_key = encrypt_api_key(api_key)
        self._repository.save_provider_api_key_encrypted(
            user_id, provider_name, encrypted_key
        )

        _logger.info(f"API key added for provider {provider_name}")

    def delete_provider_api_key(self, user_id: str, provider_name: str) -> None:
        """
        Delete API key for a provider and apply Ollama fallback for any models
        that were using this provider.

        Args:
            user_id: User's ID
            provider_name: Provider name

        Raises:
            HTTPException: If provider is invalid
        """
        if provider_name not in AVAILABLE_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider: {provider_name}",
            )

        self._repository.delete_provider_api_key(user_id, provider_name)
        _logger.info(f"API key deleted for provider {provider_name}")

        self._apply_ollama_fallback(user_id, provider_name)

    def get_provider_api_key(self, user_id: str, provider_name: str) -> str | None:
        """
        Get decrypted API key for a provider (for internal use)

        Args:
            user_id: User's ID
            provider_name: Provider name

        Returns:
            Decrypted API key or None
        """
        encrypted_key = self._repository.get_provider_api_key_encrypted(
            user_id, provider_name
        )
        if not encrypted_key:
            return None

        return decrypt_api_key(encrypted_key)

    def _apply_ollama_fallback(self, user_id: str, removed_provider: str) -> None:
        """
        Reset any model that was using the given provider back to the Ollama defaults.

        Args:
            user_id: User's ID
            removed_provider: Provider whose API key was just removed
        """
        defaults = DEFAULT_USER_SETTINGS["models"]
        checks = [
            (
                self._repository.get_chat_model,
                self._repository.update_chat_model,
                "chat_model",
            ),
            (
                self._repository.get_summary_model,
                self._repository.update_summary_model,
                "summary_model",
            ),
            (
                self._repository.get_retrieval_model,
                self._repository.update_retrieval_model,
                "retrieval_model",
            ),
        ]
        for get_fn, update_fn, key in checks:
            current = get_fn(user_id)
            if current and current.provider == removed_provider:
                update_fn(user_id, ModelConfig(**defaults[key]))
                _logger.info(
                    f"Fallback: reset {key} from {removed_provider} to Ollama defaults"
                )

    def _validate_api_key(self, provider_name: str, api_key: str) -> None:
        """Validate an API key by attempting a live models.list() call.

        Each provider entry maps to a callable that accepts the key and
        performs a minimal authenticated request. Ollama has no entry because
        it never requires a key.

        Raises:
            HTTPException 400: Unknown provider.
            HTTPException 401: The key was rejected or the request failed.
        """
        _validators: dict[str, Callable[[str], object]] = {
            "OpenAI": lambda k: OpenAI(api_key=k).models.list(),
            "Anthropic": lambda k: Anthropic(api_key=k).models.list(),
        }

        if provider_name == "Ollama":
            return  # no key required, nothing to validate

        if provider_name not in _validators:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown provider: {provider_name}",
            )

        try:
            _validators[provider_name](api_key)
        except Exception as e:
            _logger.error(f"API key validation failed for {provider_name}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid API key for {provider_name}",
            )
