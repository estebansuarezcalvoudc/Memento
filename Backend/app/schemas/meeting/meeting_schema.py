from datetime import date as date_type
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MeetingMetadata(BaseModel):
    title: str
    date: date_type
    language: Optional[str] = Field(None, description="Language code for transcription")
    number_of_speakers: Optional[int] = Field(None, ge=2)


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
