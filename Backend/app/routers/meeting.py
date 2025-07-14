from fastapi import APIRouter, File, UploadFile, Form, status, Depends
from fastapi.responses import Response
from datetime import date
from typing import Optional
from sqlmodel import Session
from ..models.meeting_model import CreateMeeting, RetrieveMeeting
from ..core.logging import setup_logger
from ..services.process_meeting import process_meeting, get_session

logger = setup_logger(__name__)
router = APIRouter()


def get_meeting_create(
    title: str = Form(...),
    date: date = Form(...),
    language: Optional[str] = Form(None),
    number_of_speakers: Optional[int] = Form(None),
) -> CreateMeeting:
    return CreateMeeting(
        title=title, date=date, language=language, number_of_speakers=number_of_speakers
    )


def get_create_meeting_info(
    metadata: CreateMeeting = Depends(get_meeting_create), audio: UploadFile = File(...)
):
    return metadata, audio


@router.post(
    "/meetings",
    response_model=RetrieveMeeting,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new meeting and process it",
)
async def create_meeting(
    meeting: tuple[CreateMeeting, UploadFile] = Depends(get_create_meeting_info),
    session: Session = Depends(get_session),
):
    logger.debug("Create meeting was called")

    metadata, audio = meeting

    audio_bytes = await audio.read()

    result = process_meeting(metadata, audio_bytes, session)

    return Response(
        content=result.model_dump_json(),
        media_type="application/json",
        status_code=status.HTTP_201_CREATED,
    )
