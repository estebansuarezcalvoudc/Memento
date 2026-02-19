from typing import Optional, cast

import pymongo

from ....core.openai_factory import ProviderName
from ....core.settings import settings
from ....schemas.settings.provider_schema import Provider, ProviderSettings
from ...interfaces.settings_repo import SettingsRepository as AbstractSettingsRepository


class SettingsMongoRepository(AbstractSettingsRepository):
    """Repository for user settings data access"""

    AVAILABLE_PROVIDERS = {
        "OpenAI": {"requires_api_key": True},
        "Ollama": {"requires_api_key": False},
    }

    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["tfg_db"]
        self._collection = mydb["user_settings"]

    def get_providers(self, username: str) -> list[Provider]:
        """
        Get all providers with their status for a user

        Args:
            username: User's username

        Returns:
            List of Provider objects with current status
        """
        user_data = self._collection.find_one(
            {"username": username}, {"settings.providers": True, "_id": False}
        )

        user_providers = (
            user_data.get("settings", {}).get("providers", {}) if user_data else {}
        )

        providers = []
        for provider_name, config in self.AVAILABLE_PROVIDERS.items():
            user_provider_data = user_providers.get(provider_name, {})

            has_api_key = None
            if config["requires_api_key"]:
                has_api_key = bool(user_provider_data.get("api_key_encrypted"))

            providers.append(
                Provider(
                    name=cast(
                        ProviderName, provider_name
                    ),  # Safe cast: comes from AVAILABLE_PROVIDERS
                    requires_api_key=config["requires_api_key"],
                    active=user_provider_data.get("active", True),
                    has_api_key=has_api_key,
                )
            )

        return providers

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
        user_data = self._collection.find_one(
            {"username": username},
            {f"settings.providers.{provider_name}": True, "_id": False},
        )

        if not user_data or "settings" not in user_data:
            return None

        provider_data = (
            user_data.get("settings", {}).get("providers", {}).get(provider_name)
        )

        if not provider_data:
            return None

        return ProviderSettings(**provider_data)

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
        if provider_name not in self.AVAILABLE_PROVIDERS:
            raise ValueError(f"Invalid provider: {provider_name}")

        if not self.AVAILABLE_PROVIDERS[provider_name]["requires_api_key"]:
            raise ValueError(f"Provider {provider_name} does not require an API key")

        self._collection.update_one(
            {"username": username},
            {
                "$set": {
                    f"settings.providers.{provider_name}.api_key_encrypted": encrypted_api_key,
                    f"settings.providers.{provider_name}.active": True,
                }
            },
        )

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
        user_data = self._collection.find_one(
            {"username": username},
            {
                f"settings.providers.{provider_name}.api_key_encrypted": True,
                "_id": False,
            },
        )

        if not user_data:
            return None

        encrypted_key = (
            user_data.get("settings", {})
            .get("providers", {})
            .get(provider_name, {})
            .get("api_key_encrypted")
        )

        return encrypted_key

    def delete_provider_api_key(self, username: str, provider_name: str) -> None:
        """
        Delete API key for a provider

        Args:
            username: User's username
            provider_name: Provider name
        """
        self._collection.update_one(
            {"username": username},
            {
                "$unset": {f"settings.providers.{provider_name}.api_key_encrypted": ""},
                "$set": {f"settings.providers.{provider_name}.active": False},
            },
        )

    def update_provider_status(
        self, username: str, provider_name: str, active: bool
    ) -> None:
        """
        Update provider active status

        Args:
            username: User's username
            provider_name: Provider name
            active: Whether to activate or deactivate
        """
        self._collection.update_one(
            {"username": username},
            {"$set": {f"settings.providers.{provider_name}.active": active}},
        )

    def get_model_settings(self, username: str) -> dict | None:
        """
        Get user's model settings

        Args:
            username: User's username

        Returns:
            Dictionary with chat_model and summary_model or None
        """
        user_data = self._collection.find_one(
            {"username": username}, {"settings.models": 1, "_id": 0}
        )

        if not user_data or "settings" not in user_data:
            return None

        return user_data.get("settings", {}).get("models")

    def update_model_settings(self, username: str, model_data: dict) -> None:
        """
        Update user's model settings (partial update)

        Args:
            username: User's username
            model_data: Dictionary with chat_model and/or summary_model
        """
        update_fields = {}
        for key, value in model_data.items():
            update_fields[f"settings.models.{key}"] = value

        self._collection.update_one(
            {"username": username},
            {"$set": update_fields},
        )

    def get_whisperx_settings(self, username: str) -> dict | None:
        """
        Get user's WhisperX transcription settings

        Args:
            username: User's username

        Returns:
            Dictionary with model_size and compute_type or None
        """
        user_data = self._collection.find_one(
            {"username": username},
            {"settings.transcription.whisperx": True, "_id": False},
        )

        if not user_data or "settings" not in user_data:
            return None

        return user_data.get("settings", {}).get("transcription", {}).get("whisperx")

    def update_whisperx_settings(self, username: str, whisperx_data: dict) -> None:
        """
        Update user's WhisperX settings (partial update)

        Args:
            username: User's username
            whisperx_data: Dictionary with model_size and/or compute_type
        """
        update_fields = {}
        for key, value in whisperx_data.items():
            update_fields[f"settings.transcription.whisperx.{key}"] = value

        self._collection.update_one(
            {"username": username},
            {"$set": update_fields},
        )

    def get_system_prompt(self, username: str) -> Optional[str]:
        """
        Get user's custom system prompt

        Args:
            username: User's username

        Returns:
            Custom system prompt or None if not set
        """
        user_data = self._collection.find_one(
            {"username": username}, {"settings.templates.system_prompt": 1, "_id": 0}
        )

        if not user_data or "settings" not in user_data:
            return None

        return user_data.get("settings", {}).get("templates", {}).get("system_prompt")

    def update_system_prompt(self, username: str, system_prompt: str) -> None:
        """
        Update user's custom system prompt

        Args:
            username: User's username
            system_prompt: New system prompt
        """
        self._collection.update_one(
            {"username": username},
            {"$set": {"settings.templates.system_prompt": system_prompt}},
        )
