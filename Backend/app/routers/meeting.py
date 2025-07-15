from datetime import date
from typing import Annotated, List, Optional
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session

from ..core.logging import setup_logger
from ..models.meeting_model import CreateMeeting, RetrieveMeeting
from ..services.process_meeting import get_session, process_meeting
from .exceptions import AttributeListSizeMismatch
import textwrap

_logger = setup_logger(__name__)
router = APIRouter()


@router.post(
    "/meetings",
    response_model=List[RetrieveMeeting],
    status_code=status.HTTP_201_CREATED,
    summary="Create meetings and process them",
)
async def create_meetings(
    meetings: Annotated[
        str,
        Form(
            ...,
            description="JSON string of CreateMeeting objects",
            example=textwrap.dedent(
                """
                [
                    {
                        "title": "Team Standup",
                        "date": "2025-07-15",
                        "language": "en",
                        "number_of_speakers": 3
                    },
                    {
                        "title": "Client Meeting",
                        "date": "2025-07-16",
                    }
                ]
            """
            ).strip(),
        ),
    ],
    audios: List[UploadFile] = File(...),
    session: Session = Depends(get_session),
):
    _logger.debug("Create meetings was called")

    # Parse JSON string to list of CreateMeeting objects
    try:
        meetings_data = json.loads(meetings)
        meetings_list = [CreateMeeting(**meeting) for meeting in meetings_data]
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")

    if len(meetings_list) != len(audios):
        raise AttributeListSizeMismatch()

    results = []
    for metadata, audio in zip(meetings_list, audios):
        audio_bytes = await audio.read()
        result = process_meeting(metadata, audio_bytes, session)
        results.append(result)

    return results
