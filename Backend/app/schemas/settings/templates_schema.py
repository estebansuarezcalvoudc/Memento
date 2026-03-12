from pathlib import Path
from typing import ClassVar

from pydantic import BaseModel, Field, field_validator

_ASSETS = Path(__file__).parent.parent.parent / "assets"

DEFAULT_PROMPT = (_ASSETS / "default_prompt.txt").read_text(encoding="utf-8")
DEFAULT_PROMPT_ES = (_ASSETS / "default_prompt_es.txt").read_text(encoding="utf-8")

DEFAULT_PROMPTS: dict[str, str] = {
    "en": DEFAULT_PROMPT,
    "es": DEFAULT_PROMPT_ES,
}


class SystemPromptResponse(BaseModel):
    """Response with system prompt"""

    system_prompt: str = Field(
        ..., description="System prompt for meeting summarization"
    )


class SystemPromptUpdate(BaseModel):
    """Request to update system prompt"""

    MIN_PROMPT_LENGTH: ClassVar[int] = 50
    MAX_PROMPT_LENGTH: ClassVar[int] = 5000

    system_prompt: str = Field(
        ...,
        description=f"Custom system prompt ({MIN_PROMPT_LENGTH}-{MAX_PROMPT_LENGTH} characters)",
    )

    @field_validator("system_prompt")
    @classmethod
    def validate_system_prompt(cls, v: str) -> str:
        """Validate that prompt is not just whitespace and meets length requirements"""
        stripped = v.strip()
        if not stripped:
            raise ValueError("System prompt cannot be empty or just whitespace")
        if len(stripped) < cls.MIN_PROMPT_LENGTH:
            raise ValueError(
                f"System prompt must be at least {cls.MIN_PROMPT_LENGTH} characters long"
            )
        if len(stripped) > cls.MAX_PROMPT_LENGTH:
            raise ValueError(
                f"System prompt must be at most {cls.MAX_PROMPT_LENGTH} characters long"
            )
        return stripped
