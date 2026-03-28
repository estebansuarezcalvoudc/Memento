from typing import Optional, cast

from ....core.providers_config import AVAILABLE_PROVIDERS, ProviderName
from ....schemas.settings.model_schema import ModelConfig
from ....schemas.settings.provider_schema import Provider, ProviderSettings
from ...interfaces.settings_repo import SettingsRepository as AbstractSettingsRepository
from .mongo_client import get_mongo_database


class SettingsMongoRepository(AbstractSettingsRepository):
    """Repository for user settings data access"""

    def __init__(self) -> None:
        mydb = get_mongo_database()
        self._collection = mydb["user_settings"]

    def get_providers(self, user_id: str) -> list[Provider]:
        user_data = self._collection.find_one(
            {"user_id": user_id}, {"settings.providers": True, "_id": False}
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
        self, user_id: str, provider_name: str
    ) -> ProviderSettings | None:
        user_data = self._collection.find_one(
            {"user_id": user_id},
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
        self, user_id: str, provider_name: str, encrypted_api_key: str
    ) -> None:
        if provider_name not in AVAILABLE_PROVIDERS:
            raise ValueError(f"Invalid provider: {provider_name}")

        if not AVAILABLE_PROVIDERS[provider_name]["requires_api_key"]:
            raise ValueError(f"Provider {provider_name} does not require an API key")

        self._collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    f"settings.providers.{provider_name}.api_key_encrypted": encrypted_api_key,
                }
            },
            upsert=True,
        )

    def get_provider_api_key_encrypted(
        self, user_id: str, provider_name: str
    ) -> Optional[str]:
        user_data = self._collection.find_one(
            {"user_id": user_id},
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

    def delete_provider_api_key(self, user_id: str, provider_name: str) -> None:
        self._collection.update_one(
            {"user_id": user_id},
            {
                "$unset": {f"settings.providers.{provider_name}.api_key_encrypted": ""},
            },
        )

    def get_chat_model(self, user_id: str) -> ModelConfig:
        """Get user's chat model configuration"""
        user_data = self._collection.find_one(
            {"user_id": user_id}, {"settings.models.chat_model": 1, "_id": 0}
        )
        data = (
            user_data.get("settings", {}).get("models", {}).get("chat_model")
            if user_data
            else None
        )
        if not data:
            return None  # type: ignore[return-value]
        return ModelConfig(**data)

    def update_chat_model(self, user_id: str, model: ModelConfig) -> None:
        """Update user's chat model configuration"""
        self._collection.update_one(
            {"user_id": user_id},
            {"$set": {"settings.models.chat_model": model.model_dump()}},
        )

    def get_summary_model(self, user_id: str) -> ModelConfig:
        """Get user's summary model configuration"""
        user_data = self._collection.find_one(
            {"user_id": user_id}, {"settings.models.summary_model": 1, "_id": 0}
        )
        data = (
            user_data.get("settings", {}).get("models", {}).get("summary_model")
            if user_data
            else None
        )
        if not data:
            return None  # type: ignore[return-value]
        return ModelConfig(**data)

    def update_summary_model(self, user_id: str, model: ModelConfig) -> None:
        """Update user's summary model configuration"""
        self._collection.update_one(
            {"user_id": user_id},
            {"$set": {"settings.models.summary_model": model.model_dump()}},
            upsert=True,
        )

    def get_retrieval_model(self, user_id: str) -> ModelConfig:
        """Get user's retrieval model configuration"""
        user_data = self._collection.find_one(
            {"user_id": user_id}, {"settings.models.retrieval_model": 1, "_id": 0}
        )
        data = (
            user_data.get("settings", {}).get("models", {}).get("retrieval_model")
            if user_data
            else None
        )
        if not data:
            return None  # type: ignore[return-value]
        return ModelConfig(**data)

    def update_retrieval_model(self, user_id: str, model: ModelConfig) -> None:
        """Update user's retrieval model configuration"""
        self._collection.update_one(
            {"user_id": user_id},
            {"$set": {"settings.models.retrieval_model": model.model_dump()}},
            upsert=True,
        )

    def get_transcription_settings(self, user_id: str) -> dict | None:
        user_data = self._collection.find_one(
            {"user_id": user_id},
            {"settings.transcription": True, "_id": False},
        )

        if not user_data or "settings" not in user_data:
            return None

        return user_data.get("settings", {}).get("transcription")

    def update_transcription_settings(self, user_id: str, data: dict) -> None:
        update_fields = {}
        for key, value in data.items():
            update_fields[f"settings.transcription.{key}"] = value

        self._collection.update_one(
            {"user_id": user_id}, {"$set": update_fields}, upsert=True
        )

    def get_transcription_active_provider(self, user_id: str) -> str | None:
        user_data = self._collection.find_one(
            {"user_id": user_id},
            {"settings.transcription.active_provider": True, "_id": False},
        )
        if not user_data:
            return None
        return (
            user_data.get("settings", {})
            .get("transcription", {})
            .get("active_provider")
        )

    def set_transcription_active_provider(
        self, user_id: str, provider_name: str
    ) -> None:
        self._collection.update_one(
            {"user_id": user_id},
            {"$set": {"settings.transcription.active_provider": provider_name}},
            upsert=True,
        )

    def get_transcription_provider_settings(
        self, user_id: str, provider_name: str
    ) -> dict | None:
        user_data = self._collection.find_one(
            {"user_id": user_id},
            {"settings.transcription": True, "_id": False},
        )
        if not user_data:
            return None

        transcription_settings = user_data.get("settings", {}).get("transcription", {})
        providers = transcription_settings.get("providers", {})
        provider_settings = providers.get(provider_name)
        if provider_settings is not None:
            return provider_settings

        if provider_name == "whisperx":
            legacy_keys = ["model_size", "compute_type", "device"]
            legacy_settings = {
                key: transcription_settings[key]
                for key in legacy_keys
                if key in transcription_settings
            }
            return legacy_settings or None

        return None

    def update_transcription_provider_settings(
        self, user_id: str, provider_name: str, data: dict
    ) -> None:
        update_fields = {
            f"settings.transcription.providers.{provider_name}.{key}": value
            for key, value in data.items()
        }
        if not update_fields:
            return

        self._collection.update_one(
            {"user_id": user_id}, {"$set": update_fields}, upsert=True
        )

    def save_transcription_provider_api_key_encrypted(
        self, user_id: str, provider_name: str, encrypted_api_key: str
    ) -> None:
        self._collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    f"settings.transcription.providers.{provider_name}.api_key_encrypted": encrypted_api_key,
                }
            },
            upsert=True,
        )

    def get_transcription_provider_api_key_encrypted(
        self, user_id: str, provider_name: str
    ) -> Optional[str]:
        user_data = self._collection.find_one(
            {"user_id": user_id},
            {
                f"settings.transcription.providers.{provider_name}.api_key_encrypted": True,
                "_id": False,
            },
        )
        if not user_data:
            return None

        return (
            user_data.get("settings", {})
            .get("transcription", {})
            .get("providers", {})
            .get(provider_name, {})
            .get("api_key_encrypted")
        )

    def delete_transcription_provider_api_key(
        self, user_id: str, provider_name: str
    ) -> None:
        self._collection.update_one(
            {"user_id": user_id},
            {
                "$unset": {
                    f"settings.transcription.providers.{provider_name}.api_key_encrypted": ""
                }
            },
        )

    def get_system_prompt(self, user_id: str) -> Optional[str]:
        user_data = self._collection.find_one(
            {"user_id": user_id}, {"settings.templates.system_prompt": 1, "_id": 0}
        )

        if not user_data or "settings" not in user_data:
            return None

        return user_data.get("settings", {}).get("templates", {}).get("system_prompt")

    def update_system_prompt(self, user_id: str, system_prompt: str) -> None:
        self._collection.update_one(
            {"user_id": user_id},
            {"$set": {"settings.templates.system_prompt": system_prompt}},
            upsert=True,
        )

    def create_user_settings(self, user_id: str, data: dict) -> None:
        """
        Persist an initial settings document for a user.
        Uses $setOnInsert so existing documents are never overwritten.
        """
        self._collection.update_one(
            {"user_id": user_id},
            {"$setOnInsert": {"user_id": user_id, "settings": data}},
            upsert=True,
        )

    def delete_user_data(self, user_id: str) -> None:
        self._collection.delete_many({"user_id": user_id})
