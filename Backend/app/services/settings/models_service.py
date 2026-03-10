from fastapi import HTTPException, status
import ollama
from ...core.providers_config import list_models
from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.settings.model_schema import (
    AvailableModel,
    ModelConfig,
    PullModelRequest,
)


class ModelsService:
    """Service for managing user model configurations and listing available models"""

    def __init__(self, repository: SettingsRepository) -> None:
        self._repository: SettingsRepository = repository

    def get_available_models(self, user_id: str) -> list[AvailableModel]:
        """
        Get all available models from active providers

        Args:
            user_id: User's ID

        Returns:
            List of AvailableModel objects
        """
        available_models = []

        providers = self._repository.get_providers(user_id)

        for provider in providers:
            if provider.requires_api_key and not provider.has_api_key:
                continue

            encrypted_key = (
                self._repository.get_provider_api_key_encrypted(user_id, provider.name)
                if provider.requires_api_key
                else None
            )
            for model_id in list_models(provider.name, encrypted_key):
                available_models.append(
                    AvailableModel(id=model_id, provider=provider.name)
                )

        return available_models

    def get_chat_model(self, user_id: str) -> ModelConfig:
        """Get user's configured chat model"""
        return self._repository.get_chat_model(user_id)

    def get_summary_model(self, user_id: str) -> ModelConfig:
        """Get user's configured summary model"""
        return self._repository.get_summary_model(user_id)

    def get_retrieval_model(self, user_id: str) -> ModelConfig:
        """Get user's configured retrieval model"""
        return self._repository.get_retrieval_model(user_id)

    def update_chat_model(self, user_id: str, model: ModelConfig) -> ModelConfig:
        """
        Update user's chat model configuration

        Args:
            user_id: User's ID
            model: New chat model configuration

        Returns:
            Updated ModelConfig
        """
        self._repository.update_chat_model(user_id, model)
        return model

    def update_summary_model(self, user_id: str, model: ModelConfig) -> ModelConfig:
        """
        Update user's summary model configuration

        Args:
            user_id: User's ID
            model: New summary model configuration

        Returns:
            Updated ModelConfig
        """
        self._repository.update_summary_model(user_id, model)
        return model

    def update_retrieval_model(self, user_id: str, model: ModelConfig) -> ModelConfig:
        """
        Update user's retrieval model configuration

        Args:
            user_id: User's ID
            model: New retrieval model configuration

        Returns:
            Updated ModelConfig
        """
        self._repository.update_retrieval_model(user_id, model)
        return model

    def pull_model(self, pull_model_request: PullModelRequest) -> None:
        if pull_model_request.provider == "Ollama":
            ollama.pull(pull_model_request.model)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider '{pull_model_request.provider}' cannot pull models",
            )
