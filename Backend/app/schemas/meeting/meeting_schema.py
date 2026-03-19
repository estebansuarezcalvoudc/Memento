from datetime import date as date_type
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..settings.whisperx_schema import SUPPORTED_LANGUAGES


class MeetingMetadata(BaseModel):
    """Basic meeting metadata without processing configuration."""

    title: str
    date: date_type
    language: Optional[str] = Field(None, description="Language code for transcription")
    number_of_speakers: Optional[int] = Field(None, ge=2)

    @field_validator("language")
    @classmethod
    def validate_language(cls, language):
        if language is not None and language not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Language '{language}' not supported. "
                f"Supported languages: {SUPPORTED_LANGUAGES}"
            )
        return language


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
