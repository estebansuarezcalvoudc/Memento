from fastapi import APIRouter, File, UploadFile, Form, status, Depends
from datetime import date
from typing import Optional
from sqlmodel import Session
from ..models.meeting_model import CreateMeeting, RetrieveMeeting
from ..core.logging import setup_logger
from ..services.process_meeting import process_meeting, get_session

logger = setup_logger(__name__)
router = APIRouter()


def _get_meeting_create_metadata(
    title: str = Form(...),
    date: date = Form(...),
    language: Optional[str] = Form(None),
    number_of_speakers: Optional[int] = Form(None),
) -> CreateMeeting:
    return CreateMeeting(
        title=title, date=date, language=language, number_of_speakers=number_of_speakers
    )


def _get_meeting_create_data(
    metadata: CreateMeeting = Depends(_get_meeting_create_metadata),
    audio: UploadFile = File(...),
):
    return metadata, audio


@router.post(
    "/meetings",
    response_model=RetrieveMeeting,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new meeting and process it",
)
async def create_meeting(
    meeting: tuple[CreateMeeting, UploadFile] = Depends(_get_meeting_create_data),
    session: Session = Depends(get_session),
):
    logger.debug("Create meeting was called")

    metadata, audio = meeting

    audio_bytes = await audio.read()

    return process_meeting(metadata, audio_bytes, session)
