from ...core.logging import setup_logger
from ...core.openai_factory import create_openai_client
from ...repositories.settings.settings_repo import SettingsRepository
from ...schemas.settings.model_schema import (
    AvailableModel,
    ConfiguredModelsRequest,
    ConfiguredModelsResponse,
)

_logger = setup_logger(__name__)


class ModelsService:
    """Service for managing user model configurations and listing available models"""

    def __init__(self) -> None:
        self._repository = SettingsRepository()

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
        active_providers = [p for p in providers if p.active]

        for provider in active_providers:
            try:
                client = create_openai_client(provider.name, username=username)
                models_response = client.models.list()

                for model in models_response.data:
                    available_models.append(
                        AvailableModel(id=model.id, provider=provider.name)
                    )

            except Exception as e:
                _logger.warning(
                    f"Failed to fetch models from {provider.name}: {str(e)}"
                )

        return available_models

    def get_configured_models(self, username: str) -> ConfiguredModelsResponse:
        """
        Get user's configured models

        Args:
            username: User's username

        Returns:
            ConfiguredModelsResponse with chat_model and summary_model
        """
        model_settings = self._repository.get_model_settings(username)

        if model_settings is None:
            return ConfiguredModelsResponse(chat_model=None, summary_model=None)

        return ConfiguredModelsResponse(
            chat_model=model_settings.get("chat_model"),
            summary_model=model_settings.get("summary_model"),
        )

    def update_configured_models(
        self, username: str, request: ConfiguredModelsRequest
    ) -> ConfiguredModelsResponse:
        """
        Update user's configured models (partial update)

        Args:
            username: User's username
            request: Models to update

        Returns:
            Updated ConfiguredModelsResponse
        """
        update_data = {}
        if request.chat_model is not None:
            update_data["chat_model"] = request.chat_model.model_dump()
        if request.summary_model is not None:
            update_data["summary_model"] = request.summary_model.model_dump()

        self._repository.update_model_settings(username, update_data)

        return self.get_configured_models(username)
