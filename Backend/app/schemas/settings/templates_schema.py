from pydantic import BaseModel, Field, field_validator

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

    system_prompt: str = Field(
        ...,
        description="Custom system prompt (50-5000 characters)",
    )

    @field_validator("system_prompt")
    @classmethod
    def validate_system_prompt(cls, v: str) -> str:
        """Validate that prompt is not just whitespace and meets length requirements"""
        stripped = v.strip()
        if not stripped:
            raise ValueError("System prompt cannot be empty or just whitespace")
        if len(stripped) < 50:
            raise ValueError("System prompt must be at least 50 characters long")
        if len(stripped) > 5000:
            raise ValueError("System prompt must be at most 5000 characters long")
        return stripped
