from pydantic import BaseModel, Field, field_validator


class SystemPromptResponse(BaseModel):
    """Response with system prompt"""

    system_prompt: str = Field(
        ..., description="System prompt for meeting summarization"
    )


class SystemPromptUpdate(BaseModel):
    """Request to update system prompt"""

    system_prompt: str = Field(
        ...,
        min_length=50,
        max_length=5000,
        description="Custom system prompt (50-5000 characters)",
    )

    @field_validator("system_prompt")
    @classmethod
    def validate_system_prompt(cls, v: str) -> str:
        """Validate that prompt is not just whitespace"""
        if not v.strip():
            raise ValueError("System prompt cannot be empty or just whitespace")
        return v.strip()
