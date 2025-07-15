from typing import Annotated
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session

from ..core.logging import setup_logger
from ..models.meeting_model import CreateMeeting, RetrieveMeeting
from ..services.process_meeting import get_session, process_meeting
from .exceptions import AttributeListSizeMismatch

_logger = setup_logger(__name__)
router = APIRouter()


def _parse_meetings_metadata(
    meetings_metadata: Annotated[
        str,
        Form(
            ...,
            description="JSON string of CreateMeeting objects",
            openapi_examples={
                "example": {
                    "value": json.dumps([
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
                    ])
                }
            }
        ),
    ],
) -> list[CreateMeeting]:
    try:
        meetings_data = json.loads(meetings_metadata)
        return [CreateMeeting(**meeting) for meeting in meetings_data]
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}",
        )


@router.post(
    "/meetings",
    response_model=list[RetrieveMeeting],
    status_code=status.HTTP_201_CREATED,
    summary="Create meetings and process them",
)
async def create_meetings(
    meetings_list: list[CreateMeeting] = Depends(_parse_meetings_metadata),
    audios: list[UploadFile] = File(...),
    session: Session = Depends(get_session),
):
    _logger.debug("Create meetings was called")

    if len(meetings_list) != len(audios):
        raise AttributeListSizeMismatch()

    results = []
    for metadata, audio in zip(meetings_list, audios):
        audio_bytes = await audio.read()
        result = process_meeting(metadata, audio_bytes, session)
        results.append(result)

    return results
