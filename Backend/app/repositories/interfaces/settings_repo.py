from abc import ABC, abstractmethod
from typing import Optional

from ...schemas.settings.model_schema import ModelConfig
from ...schemas.settings.provider_schema import Provider, ProviderSettings


class SettingsRepository(ABC):
    """Abstract repository interface for user settings data access"""

    @abstractmethod
    def get_providers(self, user_id: str) -> list[Provider]:
        """
        Get all providers with their status for a user

        Args:
            user_id: User's ID

        Returns:
            List of Provider objects with current status
        """
        pass

    @abstractmethod
    def get_provider_settings(
        self, user_id: str, provider_name: str
    ) -> ProviderSettings | None:
        """
        Get specific provider settings for a user

        Args:
            user_id: User's ID
            provider_name: Provider name

        Returns:
            ProviderSettings object or None if not found
        """
        pass

    @abstractmethod
    def save_provider_api_key_encrypted(
        self, user_id: str, provider_name: str, encrypted_api_key: str
    ) -> None:
        """
        Save encrypted API key for a provider

        Args:
            user_id: User's ID
            provider_name: Provider name (e.g., "OpenAI")
            encrypted_api_key: Already encrypted API key

        Raises:
            ValueError: If provider is not valid or doesn't require API key
        """
        pass

    @abstractmethod
    def get_provider_api_key_encrypted(
        self, user_id: str, provider_name: str
    ) -> Optional[str]:
        """
        Get encrypted API key for a provider

        Args:
            user_id: User's ID
            provider_name: Provider name

        Returns:
            Encrypted API key or None if not found
        """
        pass

    @abstractmethod
    def delete_provider_api_key(self, user_id: str, provider_name: str) -> None:
        """
        Delete API key for a provider

        Args:
            user_id: User's ID
            provider_name: Provider name
        """
        pass

    @abstractmethod
    def get_chat_model(self, user_id: str) -> ModelConfig:
        """
        Get user's chat model configuration

        Args:
            user_id: User's ID

        Returns:
            ModelConfig
        """
        pass

    @abstractmethod
    def update_chat_model(self, user_id: str, model: ModelConfig) -> None:
        """
        Update user's chat model configuration

        Args:
            user_id: User's ID
            model: Chat model configuration
        """
        pass

    @abstractmethod
    def get_summary_model(self, user_id: str) -> ModelConfig:
        """
        Get user's summary model configuration

        Args:
            user_id: User's ID

        Returns:
            ModelConfig
        """
        pass

    @abstractmethod
    def update_summary_model(self, user_id: str, model: ModelConfig) -> None:
        """
        Update user's summary model configuration

        Args:
            user_id: User's ID
            model: Summary model configuration
        """
        pass

    @abstractmethod
    def get_retrieval_model(self, user_id: str) -> ModelConfig:
        """
        Get user's retrieval model configuration.
        The retrieval model is used to reformulate user messages into
        optimised vector-store search queries.

        Args:
            user_id: User's ID

        Returns:
            ModelConfig
        """
        pass

    @abstractmethod
    def update_retrieval_model(self, user_id: str, model: ModelConfig) -> None:
        """
        Update user's retrieval model configuration

        Args:
            user_id: User's ID
            model: Retrieval model configuration
        """
        pass

    @abstractmethod
    def get_transcription_settings(self, user_id: str) -> dict | None:
        """
        Get user's transcription settings

        Args:
            user_id: User's ID

        Returns:
            Dictionary with the active transcription provider's settings or None
        """
        pass

    @abstractmethod
    def update_transcription_settings(self, user_id: str, data: dict) -> None:
        """
        Update user's transcription settings (partial update)

        Args:
            user_id: User's ID
            data: Dictionary with the fields to update
        """
        pass

    @abstractmethod
    def get_transcription_active_provider(self, user_id: str) -> str | None:
        """Get active transcription provider for a user."""
        pass

    @abstractmethod
    def set_transcription_active_provider(
        self, user_id: str, provider_name: str
    ) -> None:
        """Set active transcription provider for a user."""
        pass

    @abstractmethod
    def get_transcription_provider_settings(
        self, user_id: str, provider_name: str
    ) -> dict | None:
        """Get provider-specific transcription settings for a user."""
        pass

    @abstractmethod
    def update_transcription_provider_settings(
        self, user_id: str, provider_name: str, data: dict
    ) -> None:
        """Partially update provider-specific transcription settings for a user."""
        pass

    @abstractmethod
    def save_transcription_provider_api_key_encrypted(
        self, user_id: str, provider_name: str, encrypted_api_key: str
    ) -> None:
        """Save encrypted API key for a transcription provider."""
        pass

    @abstractmethod
    def get_transcription_provider_api_key_encrypted(
        self, user_id: str, provider_name: str
    ) -> Optional[str]:
        """Get encrypted API key for a transcription provider."""
        pass

    @abstractmethod
    def delete_transcription_provider_api_key(
        self, user_id: str, provider_name: str
    ) -> None:
        """Delete API key for a transcription provider."""
        pass

    @abstractmethod
    def get_system_prompt(self, user_id: str) -> Optional[str]:
        """
        Get user's custom system prompt

        Args:
            user_id: User's ID

        Returns:
            Custom system prompt or None if not set
        """
        pass

    @abstractmethod
    def update_system_prompt(self, user_id: str, system_prompt: str) -> None:
        """
        Update user's custom system prompt

        Args:
            user_id: User's ID
            system_prompt: New system prompt
        """
        pass

    @abstractmethod
    def create_user_settings(self, user_id: str, data: dict) -> None:
        """
        Persist an initial settings document for a user.
        Idempotent — if a document already exists for the user it is left
        untouched (insert-if-not-exists semantics).

        Args:
            user_id: User's ID
            data: Settings data to persist (structure is defined by the caller)
        """
        pass

    @abstractmethod
    def delete_user_data(self, user_id: str) -> None:
        """
        Delete all settings belonging to a user

        Args:
            user_id: User ID whose data will be deleted
        """
        pass
