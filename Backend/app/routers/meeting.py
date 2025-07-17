from typing import Annotated
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session

from ..core.logging import setup_logger
from ..models.meeting_model import CreateMeeting, RetrieveMeeting
from ..services.process_meeting import get_session, process_meeting
from ..services.retrieve_meetings import get_all_meetings
from .docs.meeting_docs_loader import create_meetings_docs

_logger = setup_logger(__name__)
router = APIRouter()


def _parse_meetings_metadata(
    meetings_metadata: Annotated[
        str,
        Form(
            description=create_meetings_docs.meetings_metadata_form_description,
            example=create_meetings_docs.meetings_metadata_form_example,
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
    description=create_meetings_docs.description,
    openapi_extra=create_meetings_docs.openapi_extra,
)
async def create_meetings(
    meetings_list: list[CreateMeeting] = Depends(_parse_meetings_metadata),
    audios: list[UploadFile] = File(
        ..., description=create_meetings_docs.audios_file_description
    ),
    session: Session = Depends(get_session),
):
    _logger.debug("Create meetings was called")

    if len(meetings_list) != len(audios):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The number of metadata objects must match the number of audio files",
        )

    results = []
    for metadata, audio in zip(meetings_list, audios):
        audio_bytes = await audio.read()
        result = process_meeting(metadata, audio_bytes, session)
        results.append(result)

    return results


@router.get(
    "/meetings",
    response_model=list[RetrieveMeeting],
    status_code=status.HTTP_200_OK,
    summary="Retrieve all meetings",
)
async def retrieve_meetings(session: Session = Depends(get_session)):
    return get_all_meetings(session)
