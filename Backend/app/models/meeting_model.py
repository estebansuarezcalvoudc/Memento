from datetime import date as date_type
from typing import Optional

from sqlmodel import Field, SQLModel


class BaseMeeting(SQLModel):
    title: str
    date: date_type


class Meeting(BaseMeeting, table=True):
    __tablename__: str = "meetings"

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    transcription: str
    summary: str


class CreateMeetingRequest(BaseMeeting):
    language: Optional[str] = None
    number_of_speakers: Optional[int] = None
    summary_type: Optional[str] = "balanced"  # "concise", "balanced", "detailed", "creative"


class MeetingResponse(BaseMeeting):
    id: int
    transcription: str
    summary: str


class UpdateMeetingRequest(SQLModel):
    title: Optional[str] = None
    date: Optional[date_type] = None
