from pydantic import BaseModel, Field, field_validator
from typing import ClassVar

DEFAULT_PROMPT = """
    Analyze this meeting transcript and provide a structured summary with the following:

    1. Meeting Overview
    - Meeting date and duration
    - List of participants (if mentioned)
    - Main objectives discussed

    2. Key Decisions
    - Document all final decisions made
    - Include any deadlines or timelines established
    - Note any budgets or resources allocated

    3. Action Items
    - List each action item with:
        * Assigned owner
        * Due date (if specified)
        * Dependencies or prerequisites
        * Current status (if mentioned)

    4. Discussion Topics
    - Summarize main points for each topic
    - Highlight any challenges or risks identified
    - Note any unresolved questions requiring follow-up

    5. Next Steps
    - Upcoming milestones
    - Scheduled follow-up meetings
    - Required preparations for next discussion

    ROLE: You are a professional meeting analyst focused on extracting actionable
    insights.

    FORMAT: Present the information in clear sections with bullet points for easy
    scanning. Keep descriptions concise but include specific details like names, dates,
    and numbers when mentioned

    If any of these elements are not discussed in the meeting, note their absence rather
    than making assumptions.
"""


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
            raise ValueError(f"System prompt must be at least {cls.MIN_PROMPT_LENGTH} characters long")
        if len(stripped) > cls.MAX_PROMPT_LENGTH:
            raise ValueError(f"System prompt must be at most {cls.MAX_PROMPT_LENGTH} characters long")
        return stripped
