from pydantic import BaseModel
from datetime import date


class MeetingCreate(BaseModel):
    title: str
    date: date
