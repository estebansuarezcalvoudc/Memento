from typing import Optional, cast

import pymongo

from ....core.openai_factory import ProviderName
from ....core.providers_config import AVAILABLE_PROVIDERS
from ....core.settings import settings
from ....schemas.settings.model_schema import ModelConfig
from ....schemas.settings.provider_schema import Provider, ProviderSettings
from ...interfaces.settings_repo import SettingsRepository as AbstractSettingsRepository


class SettingsMongoRepository(AbstractSettingsRepository):
    """Repository for user settings data access"""

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
        for provider_name, config in AVAILABLE_PROVIDERS.items():
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

        requires_api_key = AVAILABLE_PROVIDERS.get(provider_name, {}).get(
            "requires_api_key", True
        )

        if not provider_data:
            return None

        return ProviderSettings(**provider_data, requires_api_key=requires_api_key)

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
        if provider_name not in AVAILABLE_PROVIDERS:
            raise ValueError(f"Invalid provider: {provider_name}")

        if not AVAILABLE_PROVIDERS[provider_name]["requires_api_key"]:
            raise ValueError(f"Provider {provider_name} does not require an API key")

        self._collection.update_one(
            {"username": username},
            {
                "$set": {
                    f"settings.providers.{provider_name}.api_key_encrypted": encrypted_api_key,
                }
            },
            upsert=True,
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
            },
        )

    def get_chat_model(self, username: str) -> ModelConfig | None:
        """Get user's chat model configuration"""
        user_data = self._collection.find_one(
            {"username": username}, {"settings.models.chat_model": 1, "_id": 0}
        )
        if not user_data or "settings" not in user_data:
            return None
        data = user_data.get("settings", {}).get("models", {}).get("chat_model")
        return ModelConfig(**data) if data else None

    def update_chat_model(self, username: str, model: ModelConfig) -> None:
        """Update user's chat model configuration"""
        self._collection.update_one(
            {"username": username},
            {"$set": {"settings.models.chat_model": model.model_dump()}},
        )

    def get_summary_model(self, username: str) -> ModelConfig | None:
        """Get user's summary model configuration"""
        user_data = self._collection.find_one(
            {"username": username}, {"settings.models.summary_model": 1, "_id": 0}
        )
        if not user_data or "settings" not in user_data:
            return None
        data = user_data.get("settings", {}).get("models", {}).get("summary_model")
        return ModelConfig(**data) if data else None

    def update_summary_model(self, username: str, model: ModelConfig) -> None:
        """Update user's summary model configuration"""
        self._collection.update_one(
            {"username": username},
            {"$set": {"settings.models.summary_model": model.model_dump()}},
            upsert=True,
        )

    def get_retrieval_model(self, username: str) -> ModelConfig | None:
        """Get user's retrieval model configuration"""
        user_data = self._collection.find_one(
            {"username": username}, {"settings.models.retrieval_model": 1, "_id": 0}
        )
        if not user_data or "settings" not in user_data:
            return None
        data = user_data.get("settings", {}).get("models", {}).get("retrieval_model")
        return ModelConfig(**data) if data else None

    def update_retrieval_model(self, username: str, model: ModelConfig) -> None:
        """Update user's retrieval model configuration"""
        self._collection.update_one(
            {"username": username},
            {"$set": {"settings.models.retrieval_model": model.model_dump()}},
            upsert=True,
        )

    def get_transcription_settings(self, username: str) -> dict | None:
        """
        Get user's transcription settings

        Args:
            username: User's username

        Returns:
            Dictionary with the active transcription provider's settings or None
        """
        user_data = self._collection.find_one(
            {"username": username},
            {"settings.transcription": True, "_id": False},
        )

        if not user_data or "settings" not in user_data:
            return None

        return user_data.get("settings", {}).get("transcription")

    def update_transcription_settings(self, username: str, data: dict) -> None:
        """
        Update user's transcription settings (partial update)

        Args:
            username: User's username
            data: Dictionary with the fields to update
        """
        update_fields = {}
        for key, value in data.items():
            update_fields[f"settings.transcription.{key}"] = value

        self._collection.update_one(
            {"username": username}, {"$set": update_fields}, upsert=True
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
            upsert=True,
        )

    def create_user_settings(self, username: str, data: dict) -> None:
        """
        Persist an initial settings document for a user.
        Uses $setOnInsert so existing documents are never overwritten.
        """
        self._collection.update_one(
            {"username": username},
            {"$setOnInsert": {"username": username, "settings": data}},
            upsert=True,
        )

    def delete_user_data(self, username: str) -> None:
        self._collection.delete_many({"username": username})
