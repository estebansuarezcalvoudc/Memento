from ...core.logging import setup_logger
from ...core.openai_factory import create_openai_client
from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.settings.model_schema import AvailableModel, ModelConfig

_logger = setup_logger(__name__)


_OPENAI_LLM_PREFIXES = ("gpt-", "o1-", "o3-", "o4-", "chatgpt-")


def _is_openai_llm(model_id: str) -> bool:
    return any(model_id.startswith(prefix) for prefix in _OPENAI_LLM_PREFIXES)


class ModelsService:
    """Service for managing user model configurations and listing available models"""

    def __init__(self, repository: SettingsRepository) -> None:
        self._repository: SettingsRepository = repository

    def get_available_models(self, username: str) -> list[AvailableModel]:
        """
        Get all available models from active providers

        Args:
            username: User's username

        Returns:
            List of AvailableModel objects
        """
        available_models = []

        providers = self._repository.get_providers(username)
        available_providers = [
            p for p in providers if not p.requires_api_key or p.has_api_key
        ]

        for provider in available_providers:
            try:
                client = create_openai_client(provider.name, username=username)
                models_response = client.models.list()

                for model in models_response.data:
                    if provider.name == "OpenAI" and not _is_openai_llm(model.id):
                        continue
                    available_models.append(
                        AvailableModel(id=model.id, provider=provider.name)
                    )

            except Exception as e:
                _logger.warning(
                    f"Failed to fetch models from {provider.name}: {str(e)}"
                )

        return available_models

    def get_chat_model(self, username: str) -> ModelConfig | None:
        """Get user's configured chat model"""
        return self._repository.get_chat_model(username)

    def get_summary_model(self, username: str) -> ModelConfig | None:
        """Get user's configured summary model"""
        return self._repository.get_summary_model(username)

    def get_retrieval_model(self, username: str) -> ModelConfig | None:
        """Get user's configured retrieval model"""
        return self._repository.get_retrieval_model(username)

    def update_chat_model(self, username: str, model: ModelConfig) -> ModelConfig:
        """
        Update user's chat model configuration

        Args:
            username: User's username
            model: New chat model configuration

        Returns:
            Updated ModelConfig
        """
        self._repository.update_chat_model(username, model)
        return model

    def update_summary_model(self, username: str, model: ModelConfig) -> ModelConfig:
        """
        Update user's summary model configuration

        Args:
            username: User's username
            model: New summary model configuration

        Returns:
            Updated ModelConfig
        """
        self._repository.update_summary_model(username, model)
        return model

    def update_retrieval_model(self, username: str, model: ModelConfig) -> ModelConfig:
        """
        Update user's retrieval model configuration

        Args:
            username: User's username
            model: New retrieval model configuration

        Returns:
            Updated ModelConfig
        """
        self._repository.update_retrieval_model(username, model)
        return model
