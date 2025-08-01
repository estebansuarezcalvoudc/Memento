from datetime import date as date_type
from typing import Optional

import whisper.tokenizer  # whisperx uses whisper's tokenizer
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CreateMeetingRequest(BaseModel):
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


class UpdateMeetingMetadata(BaseModel):
    title: Optional[str] = None
    date: Optional[date_type] = None


class MeetingMetadataResponse(BaseModel):
    id: int
    title: str
    date: date_type

    model_config = ConfigDict(from_attributes=True)


class MeetingSummaryResponse(BaseModel):
    id: int
    summary: str

    model_config = ConfigDict(from_attributes=True)


class MeetingTranscriptionResponse(BaseModel):
    id: int
    transcription: str

    model_config = ConfigDict(from_attributes=True)


class MeetingResponse(BaseModel):
    id: int
    title: str
    date: date_type
    summary: str
    transcription: str

    model_config = ConfigDict(from_attributes=True)
