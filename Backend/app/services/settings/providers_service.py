from fastapi import HTTPException, status
from openai import OpenAI

from ...core.encryption import decrypt_api_key, encrypt_api_key
from ...core.logging import setup_logger
from ...repositories.settings import SettingsMongoRepository
from ...repositories.interfaces.abstract_settings_repo import SettingsRepository
from ...schemas.settings.provider_schema import Provider

_logger = setup_logger(__name__)


class ProvidersService:
    def __init__(self, repository: SettingsRepository) -> None:
        self._repository: SettingsRepository = repository

    def get_providers(self, username: str) -> list[Provider]:
        """
        Get all providers with their status

        Args:
            username: User's username

        Returns:
            List of Provider objects
        """
        return self._repository.get_providers(username)

    def add_provider_api_key(
        self, username: str, provider_name: str, api_key: str
    ) -> None:
        """
        Add and validate API key for a provider

        Args:
            username: User's username
            provider_name: Provider name
            api_key: Plain text API key

        Raises:
            HTTPException: If provider is invalid or API key validation fails
        """
        if provider_name not in self._repository.AVAILABLE_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider: {provider_name}",
            )

        if not self._repository.AVAILABLE_PROVIDERS[provider_name]["requires_api_key"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider {provider_name} does not require an API key",
            )

        self._validate_api_key(provider_name, api_key)

        encrypted_key = encrypt_api_key(api_key)
        self._repository.save_provider_api_key_encrypted(
            username, provider_name, encrypted_key
        )

        _logger.info(f"API key added for provider {provider_name}")

    def delete_provider_api_key(self, username: str, provider_name: str) -> None:
        """
        Delete API key for a provider

        Args:
            username: User's username
            provider_name: Provider name

        Raises:
            HTTPException: If provider is invalid
        """
        if provider_name not in self._repository.AVAILABLE_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider: {provider_name}",
            )

        self._repository.delete_provider_api_key(username, provider_name)
        _logger.info(f"API key deleted for provider {provider_name}")

    def set_provider_status(
        self, username: str, provider_name: str, active: bool
    ) -> None:
        """
        Set provider active status

        Args:
            username: User's username
            provider_name: Provider name
            active: Whether to activate or deactivate

        Raises:
            HTTPException: If provider is invalid
        """
        if provider_name not in self._repository.AVAILABLE_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider: {provider_name}",
            )

        self._repository.update_provider_status(username, provider_name, active)
        _logger.info(
            f"Provider {provider_name} {'activated' if active else 'deactivated'}"
        )

    def get_provider_api_key(self, username: str, provider_name: str) -> str | None:
        """
        Get decrypted API key for a provider (for internal use)

        Args:
            username: User's username
            provider_name: Provider name

        Returns:
            Decrypted API key or None
        """
        encrypted_key = self._repository.get_provider_api_key_encrypted(
            username, provider_name
        )
        if not encrypted_key:
            return None

        return decrypt_api_key(encrypted_key)

    def _validate_api_key(self, provider_name: str, api_key: str) -> None:
        """
        Validate API key by testing connection to provider

        Args:
            provider_name: Provider name
            api_key: API key to validate

        Raises:
            HTTPException: If validation fails
        """
        try:
            if provider_name == "OpenAI":
                self._validate_openai_key(api_key)
            elif provider_name == "Ollama":
                # Ollama doesn't require validation since it doesn't use API keys
                pass
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown provider: {provider_name}",
                )
        except HTTPException:
            raise
        except Exception as e:
            _logger.error(f"API key validation failed for {provider_name}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid API key for {provider_name}: {str(e)}",
            )

    def _validate_openai_key(self, api_key: str) -> None:
        """
        Validate OpenAI API key by making a test request

        Args:
            api_key: OpenAI API key

        Raises:
            Exception: If validation fails
        """
        try:
            client = OpenAI(api_key=api_key)
            # Make a minimal request to validate the key
            client.models.list()
        except Exception as e:
            _logger.error(f"OpenAI API key validation failed: {e}")
            raise Exception(f"Failed to validate OpenAI API key: {str(e)}")
