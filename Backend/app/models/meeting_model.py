from typing import Optional
from pydantic import BaseModel
from datetime import date


class CreateMeeting(BaseModel):
    title: str
    date: date
    language: Optional[str] = None
    number_of_speakers: Optional[int] = None


class RetrieveMeeting(BaseModel):
    title: str
    date: date
    transcription: str
    language: str
    number_of_speakers: int
