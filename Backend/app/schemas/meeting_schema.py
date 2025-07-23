from datetime import date as date_type
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BaseMeetingSchema(BaseModel):
    title: str
    date: date_type


class CreateMeetingRequest(BaseMeetingSchema):
    language: Optional[str] = None
    number_of_speakers: Optional[int] = None


class UpdateMeetingRequest(BaseModel):
    title: Optional[str] = None
    date: Optional[date_type] = None


class MeetingResponse(BaseMeetingSchema):
    id: int
    transcription: str
    summary: str

    model_config = ConfigDict(from_attributes=True)
