from typing import Optional
from datetime import date
from sqlmodel import SQLModel, Field


class BaseMeeting(SQLModel):
    title: str
    date: date


class CreateMeeting(BaseMeeting):
    language: Optional[str] = None
    number_of_speakers: Optional[int] = None


class RetrieveMeeting(BaseMeeting, table=True):
    id: Optional[int] = Field(primary_key=True, index=True)
    language: str
    number_of_speakers: int
    transcription: str
    summary: str = ""
