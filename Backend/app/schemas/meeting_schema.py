from datetime import date as date_type
from typing import Optional

import whisper.tokenizer  # whisperx uses whisper's tokenizer
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .language_models_schema import LanguageModelConfiguration


class MeetingMetadata(BaseModel):
    """Basic meeting metadata without processing configuration."""

    title: str
    date: date_type
    language: Optional[str] = Field(None, description="Language code for transcription")
    number_of_speakers: Optional[int] = Field(None, ge=2)

    @field_validator("language")
    @classmethod
    def validate_language(cls, language):
        supported_languages = [*whisper.tokenizer.LANGUAGES]
        if language is not None and language not in supported_languages:
            raise ValueError(
                f"Language '{language}' not supported. "
                f"Supported languages: {supported_languages}"
            )
        return language


_DEFAULT_PROMPT = """
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


class ProcessingConfiguration(BaseModel):
    """Configuration for meeting processing (transcription and summarization)."""

    language_model_configuration: LanguageModelConfiguration = Field(
        default_factory=LanguageModelConfiguration,
        description="Configuration for the language model and provider",
    )
    system_prompt: str = Field(
        default=_DEFAULT_PROMPT,
        description="System prompt for meeting summarization",
    )


class CreateMeetingsBatchRequest(BaseModel):
    """Request for creating multiple meetings with shared processing configuration."""

    meetings_metadata: list[MeetingMetadata]
    processing_configuration: ProcessingConfiguration = Field(
        default=ProcessingConfiguration(),
        description="Configuration for processing all meetings in this batch",
    )


class UpdateMeetingMetadata(BaseModel):
    title: Optional[str] = None
    date: Optional[date_type] = None


class MeetingMetadataResponse(BaseModel):
    id: str
    title: str
    date: date_type
    language: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MeetingSummaryResponse(BaseModel):
    summary: str

    model_config = ConfigDict(from_attributes=True)


class MeetingTranscriptionResponse(BaseModel):
    transcription: str

    model_config = ConfigDict(from_attributes=True)
