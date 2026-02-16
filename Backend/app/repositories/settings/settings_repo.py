from typing import Optional

import pymongo

from ...core.logging import setup_logger
from ...core.settings import settings
from ...schemas.settings_schema import Provider, ProviderSettings

_logger = setup_logger(__name__)


class SettingsRepository:
    """Repository for user settings data access"""

    # Available providers configuration
    AVAILABLE_PROVIDERS = {
        "OpenAI": {"requires_api_key": True},
        "Ollama": {"requires_api_key": False},
    }

    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["users_db"]
        self._collection = mydb["users"]

    def get_providers(self, username: str) -> list[Provider]:
        """
        Get all providers with their status for a user

        Args:
            username: User's username

        Returns:
            List of Provider objects with current status
        """
        user_data = self._collection.find_one(
            {"username": username}, {"settings.providers": 1, "_id": 0}
        )

        user_providers = (
            user_data.get("settings", {}).get("providers", {})
            if user_data
            else {}
        )

        providers = []
        for provider_name, config in self.AVAILABLE_PROVIDERS.items():
            user_provider_data = user_providers.get(provider_name, {})

            has_api_key = None
            if config["requires_api_key"]:
                has_api_key = bool(user_provider_data.get("api_key_encrypted"))

            providers.append(
                Provider(
                    name=provider_name,
                    requires_api_key=config["requires_api_key"],
                    active=user_provider_data.get("active", True),
                    has_api_key=has_api_key,
                )
            )

        return providers

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
            {f"settings.providers.{provider_name}.api_key_encrypted": 1, "_id": 0},
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
                "$unset": {
                    f"settings.providers.{provider_name}.api_key_encrypted": ""
                },
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
