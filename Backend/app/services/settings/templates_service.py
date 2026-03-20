from app.core.logging import setup_logger

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

    @staticmethod
    def _normalize_prompt(prompt: str) -> str:
        return prompt.replace("\r\n", "\n").strip()

    @staticmethod
    def _normalize_lang(lang: str) -> str:
        return (lang or "en").split("-")[0].lower()

    def get_user_prompt(self, user_id: str, lang: str) -> SystemPromptResponse:
        """
        Get user's system prompt (returns default if not set)

        Args:
            user_id: User's ID

        Returns:
            SystemPromptResponse with user's prompt or default
        """
        normalized_lang = self._normalize_lang(lang)
        prompt = self.settings_repo.get_system_prompt(user_id)

        default_prompts_normalized = {
            self._normalize_prompt(default_prompt)
            for default_prompt in DEFAULT_PROMPTS.values()
        }

        prompt = prompt
        is_default_prompt = (
            prompt is not None
            and self._normalize_prompt(prompt) in default_prompts_normalized
        )

        if prompt is None or is_default_prompt:
            prompt = DEFAULT_PROMPTS.get(normalized_lang, DEFAULT_PROMPT)

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
        normalized_lang = self._normalize_lang(lang)
        prompt = DEFAULT_PROMPTS.get(normalized_lang, DEFAULT_PROMPT)
        return SystemPromptResponse(system_prompt=prompt)
