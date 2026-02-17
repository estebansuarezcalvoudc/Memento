from datetime import date as date_type
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..utils.supported_languages import SUPPORTED_LANGUAGES
from .language_models_schema import LanguageModelConfiguration
from .templates_schema import DEFAULT_PROMPT


class MeetingMetadata(BaseModel):
    """Basic meeting metadata without processing configuration."""

    title: str
    date: date_type
    language: Optional[str] = Field(None, description="Language code for transcription")
    number_of_speakers: Optional[int] = Field(None, ge=2)

    @field_validator("language")
    @classmethod
    def validate_language(cls, language):
        supported_languages = SUPPORTED_LANGUAGES
        if language is not None and language not in supported_languages:
            raise ValueError(
                f"Language '{language}' not supported. "
                f"Supported languages: {supported_languages}"
            )
        return language


class ProcessingConfiguration(BaseModel):
    """Configuration for meeting processing (transcription and summarization)."""

    language_model_configuration: LanguageModelConfiguration = Field(
        default_factory=LanguageModelConfiguration,
        description="Configuration for the language model and provider",
    )
    system_prompt: str = Field(
        default=DEFAULT_PROMPT,
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
    title: str
    date: date_type

    model_config = ConfigDict(from_attributes=True)


class MeetingTranscriptionResponse(BaseModel):
    transcription: str
    title: str
    date: date_type

    model_config = ConfigDict(from_attributes=True)
