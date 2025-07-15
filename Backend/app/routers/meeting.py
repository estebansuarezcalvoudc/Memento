from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlmodel import Session

from ..core.logging import setup_logger
from ..models.meeting_model import CreateMeeting, RetrieveMeeting
from ..services.process_meeting import get_session, process_meeting
from .exceptions import AttributeListSizeMismatch

logger = setup_logger(__name__)
router = APIRouter()


def _validate_meeting_lists_size(
    titles: List[str],
    dates: List[date],
    audios: List[UploadFile],
    languages: Optional[List[str]] = None,
    number_of_speakers: Optional[List[int]] = None,
) -> None:
    if len(titles) != len(dates) or len(titles) != len(audios):
        raise AttributeListSizeMismatch()

    if languages and len(languages) != len(titles):
        raise AttributeListSizeMismatch()

    if number_of_speakers and len(number_of_speakers) != len(titles):
        raise AttributeListSizeMismatch()


def _get_meetings_create_data(
    titles: List[str] = Form(...),
    dates: List[date] = Form(...),
    languages: Optional[List[str]] = Form(None),
    number_of_speakers: Optional[List[int]] = Form(None),
    audios: List[UploadFile] = File(...),
) -> List[tuple[CreateMeeting, UploadFile]]:
    _validate_meeting_lists_size(titles, dates, audios, languages, number_of_speakers)

    meetings = []
    for i in range(len(titles)):
        language = languages[i] if languages else None
        speakers = number_of_speakers[i] if number_of_speakers else None

        metadata = CreateMeeting(
            title=titles[i],
            date=dates[i],
            language=language,
            number_of_speakers=speakers,
        )
        meetings.append((metadata, audios[i]))

    return meetings


@router.post(
    "/meetings",
    response_model=List[RetrieveMeeting],
    status_code=status.HTTP_201_CREATED,
    summary="Create meetings and process them",
)
async def create_meetings(
    meetings: List[tuple[CreateMeeting, UploadFile]] = Depends(
        _get_meetings_create_data
    ),
    session: Session = Depends(get_session),
):
    logger.debug("Create meetings was called")

    results = []
    for metadata, audio in meetings:
        audio_bytes = await audio.read()
        result = process_meeting(metadata, audio_bytes, session)
        results.append(result)

    return results
