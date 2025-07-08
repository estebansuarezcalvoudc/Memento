from fastapi import APIRouter, File, UploadFile, Form, Depends
from datetime import date
from ..models.meeting_model import MeetingCreate

router = APIRouter()


def get_meeting_create(title: str = Form(...), date: date = Form(...)) -> MeetingCreate:
    return MeetingCreate(title=title, date=date)


@router.post("/meetings")
async def create_meeting(
    meeting: MeetingCreate = Depends(get_meeting_create), audio: UploadFile = File(...)
):
    return {
        "title": meeting.title,
        "date": meeting.date,
        "file_name": audio.filename,
    }
