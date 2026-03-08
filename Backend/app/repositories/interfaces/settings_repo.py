from abc import ABC, abstractmethod
from typing import Optional

from ...schemas.settings.model_schema import ModelConfig
from ...schemas.settings.provider_schema import Provider, ProviderSettings


class SettingsRepository(ABC):
    """Abstract repository interface for user settings data access"""

    @abstractmethod
    def get_providers(self, username: str) -> list[Provider]:
        """
        Get all providers with their status for a user

        Args:
            username: User's username

        Returns:
            List of Provider objects with current status
        """
        pass

    @abstractmethod
    def get_provider_settings(
        self, username: str, provider_name: str
    ) -> ProviderSettings | None:
        """
        Get specific provider settings for a user

        Args:
            username: User's username
            provider_name: Provider name

        Returns:
            ProviderSettings object or None if not found
        """
        pass

    @abstractmethod
    def save_provider_api_key_encrypted(
        self, username: str, provider_name: str, encrypted_api_key: str
    ) -> None:
        """
        Save encrypted API key for a provider

        Args:
            username: User's username
            provider_name: Provider name (e.g., "OpenAI")
            encrypted_api_key: Already encrypted API key

        Raises:
            ValueError: If provider is not valid or doesn't require API key
        """
        pass

    @abstractmethod
    def get_provider_api_key_encrypted(
        self, username: str, provider_name: str
    ) -> Optional[str]:
        """
        Get encrypted API key for a provider

        Args:
            username: User's username
            provider_name: Provider name

        Returns:
            Encrypted API key or None if not found
        """
        pass

    @abstractmethod
    def delete_provider_api_key(self, username: str, provider_name: str) -> None:
        """
        Delete API key for a provider

        Args:
            username: User's username
            provider_name: Provider name
        """
        pass

    @abstractmethod
    def get_chat_model(self, username: str) -> ModelConfig:
        """
        Get user's chat model configuration

        Args:
            username: User's username

        Returns:
            ModelConfig
        """
        pass

    @abstractmethod
    def update_chat_model(self, username: str, model: ModelConfig) -> None:
        """
        Update user's chat model configuration

        Args:
            username: User's username
            model: Chat model configuration
        """
        pass

    @abstractmethod
    def get_summary_model(self, username: str) -> ModelConfig:
        """
        Get user's summary model configuration

        Args:
            username: User's username

        Returns:
            ModelConfig
        """
        pass

    @abstractmethod
    def update_summary_model(self, username: str, model: ModelConfig) -> None:
        """
        Update user's summary model configuration

        Args:
            username: User's username
            model: Summary model configuration
        """
        pass

    @abstractmethod
    def get_retrieval_model(self, username: str) -> ModelConfig:
        """
        Get user's retrieval model configuration.
        The retrieval model is used to reformulate user messages into
        optimised vector-store search queries.

        Args:
            username: User's username

        Returns:
            ModelConfig
        """
        pass

    @abstractmethod
    def update_retrieval_model(self, username: str, model: ModelConfig) -> None:
        """
        Update user's retrieval model configuration

        Args:
            username: User's username
            model: Retrieval model configuration
        """
        pass

    @abstractmethod
    def get_transcription_settings(self, username: str) -> dict | None:
        """
        Get user's transcription settings

        Args:
            username: User's username

        Returns:
            Dictionary with the active transcription provider's settings or None
        """
        pass

    @abstractmethod
    def update_transcription_settings(self, username: str, data: dict) -> None:
        """
        Update user's transcription settings (partial update)

        Args:
            username: User's username
            data: Dictionary with the fields to update
        """
        pass

    @abstractmethod
    def get_system_prompt(self, username: str) -> Optional[str]:
        """
        Get user's custom system prompt

        Args:
            username: User's username

        Returns:
            Custom system prompt or None if not set
        """
        pass

    @abstractmethod
    def update_system_prompt(self, username: str, system_prompt: str) -> None:
        """
        Update user's custom system prompt

        Args:
            username: User's username
            system_prompt: New system prompt
        """
        pass

    @abstractmethod
    def create_user_settings(self, username: str, data: dict) -> None:
        """
        Persist an initial settings document for a user.
        Idempotent — if a document already exists for the user it is left
        untouched (insert-if-not-exists semantics).

        Args:
            username: User's username
            data: Settings data to persist (structure is defined by the caller)
        """
        pass

    @abstractmethod
    def delete_user_data(self, username: str) -> None:
        """
        Delete all settings belonging to a user

        Args:
            username: Username whose data will be deleted
        """
        pass
