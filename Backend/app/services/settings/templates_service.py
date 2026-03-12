from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.settings.templates_schema import (
    DEFAULT_PROMPT,
    DEFAULT_PROMPTS,
    SystemPromptResponse,
    SystemPromptUpdate,
)


class TemplatesService:
    """Service for managing user's system prompt templates"""

    def __init__(self, settings_repo: SettingsRepository):
        self.settings_repo = settings_repo

    def get_user_prompt(self, user_id: str) -> SystemPromptResponse:
        """
        Get user's system prompt (returns default if not set)

        Args:
            user_id: User's ID

        Returns:
            SystemPromptResponse with user's prompt or default
        """
        custom_prompt = self.settings_repo.get_system_prompt(user_id)

        prompt = custom_prompt if custom_prompt else DEFAULT_PROMPT

        return SystemPromptResponse(system_prompt=prompt)

    def update_user_prompt(
        self, user_id: str, update: SystemPromptUpdate
    ) -> SystemPromptResponse:
        """
        Update user's system prompt

        Args:
            user_id: User's ID
            update: SystemPromptUpdate with new prompt

        Returns:
            SystemPromptResponse with updated prompt
        """
        self.settings_repo.update_system_prompt(user_id, update.system_prompt)

        return SystemPromptResponse(system_prompt=update.system_prompt)

    def get_default_prompt(self, lang: str) -> SystemPromptResponse:
        """
        Get the default system prompt for the given language

        Args:
            lang: Language code (e.g. "en", "es")

        Returns:
            SystemPromptResponse with the default prompt for the requested language,
            falling back to English for any unsupported locale
        """
        prompt = DEFAULT_PROMPTS.get(lang, DEFAULT_PROMPT)
        return SystemPromptResponse(system_prompt=prompt)
