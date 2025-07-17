from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class BaseMeeting(SQLModel):
    title: str
    date: date


class CreateMeeting(BaseMeeting):
    language: Optional[str] = None
    number_of_speakers: Optional[int] = None


class RetrieveMeeting(BaseMeeting, table=True):
    __tablename__: str = "meetings"

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    language: str
    number_of_speakers: int
    transcription: str
