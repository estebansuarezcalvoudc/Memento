from fastapi import APIRouter, File, UploadFile, Form
from datetime import date

router = APIRouter()


@router.post("/meetings")
async def create_meeting(
    title: str = Form(...), date: date = Form(...), audio: UploadFile = File(...)
):
    return {
        "title": title,
        "date": date,
        "file_name": audio.filename,
    }
