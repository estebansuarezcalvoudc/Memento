from typing import get_args

from ...repositories.settings import SettingsMongoRepository
from ...schemas.settings.whisperx_schema import (
    LANGUAGE_NAMES,
    ComputeType,
    LanguageOption,
    WhisperXAvailableOptions,
    WhisperXConfiguration,
    WhisperXConfigurationUpdate,
    WhisperXModel,
)


class WhisperXService:
    """Service for WhisperX transcription configuration"""

    def __init__(self, settings_repo: SettingsMongoRepository):
        self.settings_repo = settings_repo

    def get_available_options(self) -> WhisperXAvailableOptions:
        """
        Get available WhisperX models and compute types

        Returns:
            WhisperXAvailableOptions with models and compute_types lists
        """
        models = list(get_args(WhisperXModel))
        compute_types = list(get_args(ComputeType))

        return WhisperXAvailableOptions(models=models, compute_types=compute_types)

    def get_supported_languages(self) -> list[LanguageOption]:
        """
        Get list of supported languages for WhisperX transcription

        Returns:
            List of LanguageOption objects with code and name
        """
        languages = [
            LanguageOption(code=code, name=name)
            for code, name in LANGUAGE_NAMES.items()
        ]

        # Sort by name for better UX
        return sorted(languages, key=lambda x: x.name)

    def get_user_configuration(self, username: str) -> WhisperXConfiguration:
        """
        Get user's WhisperX configuration (returns defaults if not set)

        Args:
            username: User's username

        Returns:
            WhisperXConfiguration with user's settings or defaults
        """
        user_settings = self.settings_repo.get_whisperx_settings(username)

        if not user_settings:
            return WhisperXConfiguration()

        return WhisperXConfiguration(**user_settings)

    def update_user_configuration(
        self, username: str, update: WhisperXConfigurationUpdate
    ) -> WhisperXConfiguration:
        """
        Update user's WhisperX configuration

        Args:
            username: User's username
            update: Configuration updates (partial)

        Returns:
            Updated WhisperXConfiguration
        """
        update_data = update.model_dump(exclude_none=True)

        if update_data:
            self.settings_repo.update_whisperx_settings(username, update_data)

        return self.get_user_configuration(username)
