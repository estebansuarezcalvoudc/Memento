from datetime import date as date_type
from typing import Any, Dict, List, Optional

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


class ProcessingConfiguration(BaseModel):
    """Configuration for meeting processing (transcription and summarization)."""

    language_model_configuration: LanguageModelConfiguration = Field(
        default_factory=LanguageModelConfiguration,
        description="Configuration for the language model and provider",
    )
    prompt: Optional[str] = Field(
        default=None,
        description="Custom prompt for the language model. If not provided, default prompt will be used",
    )
    options: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Options for the language model (e.g., temperature, num_predict)",
    )


class CreateMeetingsBatchRequest(BaseModel):
    """Request for creating multiple meetings with shared processing configuration."""

    meetings_metadata: List[MeetingMetadata]
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

    model_config = ConfigDict(from_attributes=True)


class MeetingSummaryResponse(BaseModel):
    summary: str

    model_config = ConfigDict(from_attributes=True)


class MeetingTranscriptionResponse(BaseModel):
    transcription: str

    model_config = ConfigDict(from_attributes=True)


class MeetingResponse(BaseModel):
    id: int
    title: str
    date: date_type
    summary: str
    transcription: str

    model_config = ConfigDict(from_attributes=True)
