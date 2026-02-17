from ...repositories.settings.settings_repo import SettingsRepository
from ...schemas.templates_schema import (
    DEFAULT_PROMPT,
    SystemPromptResponse,
    SystemPromptUpdate,
)


class TemplatesService:
    """Service for managing user's system prompt templates"""

    def __init__(self, settings_repo: SettingsRepository):
        self.settings_repo = settings_repo

    def get_user_prompt(self, username: str) -> SystemPromptResponse:
        """
        Get user's system prompt (returns default if not set)

        Args:
            username: User's username

        Returns:
            SystemPromptResponse with user's prompt or default
        """
        custom_prompt = self.settings_repo.get_system_prompt(username)

        # If user has custom prompt, return it; otherwise return default
        prompt = custom_prompt if custom_prompt else DEFAULT_PROMPT

        return SystemPromptResponse(system_prompt=prompt)

    def update_user_prompt(
        self, username: str, update: SystemPromptUpdate
    ) -> SystemPromptResponse:
        """
        Update user's system prompt

        Args:
            username: User's username
            update: SystemPromptUpdate with new prompt

        Returns:
            SystemPromptResponse with updated prompt
        """
        self.settings_repo.update_system_prompt(username, update.system_prompt)

        return SystemPromptResponse(system_prompt=update.system_prompt)

    def get_default_prompt(self) -> SystemPromptResponse:
        """
        Get the default system prompt

        Returns:
            SystemPromptResponse with default system prompt
        """
        return SystemPromptResponse(system_prompt=DEFAULT_PROMPT)
