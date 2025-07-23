import json
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session

from ..core.logging import setup_logger
from ..models.meeting_model import (
    CreateMeetingRequest,
    MeetingResponse,
    UpdateMeetingRequest,
)
from ..services.meeting_service import MeetingService
from .docs.meeting_docs_loader import create_meetings_docs
from .utils.get_session import get_session

_logger = setup_logger(__name__)
router = APIRouter()
_meeting_service = MeetingService()


def _parse_meetings_metadata(
    meetings_metadata: Annotated[
        str,
        Form(
            description=create_meetings_docs.meetings_metadata_form_description,
            example=create_meetings_docs.meetings_metadata_form_example,
        ),
    ],
) -> list[CreateMeetingRequest]:
    try:
        meetings_data = json.loads(meetings_metadata)
        return [CreateMeetingRequest(**meeting) for meeting in meetings_data]
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}",
        )


@router.post(
    "/meetings",
    response_model=list[MeetingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create meetings and process them",
    description=create_meetings_docs.description,
    openapi_extra=create_meetings_docs.openapi_extra,
    tags=["Meeting"],
)
async def create_meetings(
    meetings_list: list[CreateMeetingRequest] = Depends(_parse_meetings_metadata),
    audios: list[UploadFile] = File(
        ..., description=create_meetings_docs.audios_file_description
    ),
    session: Session = Depends(get_session),
):
    _logger.debug("Create meetings was called")

    try:
        audios_bytes = []
        for audio in audios:
            audio_bytes = await audio.read()
            audios_bytes.append(audio_bytes)

        return _meeting_service.create_meetings(meetings_list, audios_bytes, session)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        _logger.error(f"Error creating meetings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating meetings",
        )


@router.get(
    "/meetings",
    response_model=list[MeetingResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve all meetings",
    tags=["Meeting"],
)
async def retrieve_meetings(session: Session = Depends(get_session)):
    try:
        return _meeting_service.get_all_meetings(session)
    except Exception as e:
        _logger.error(f"Error retrieving meetings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving meetings",
        )


@router.delete(
    "/meetings/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a meeting",
    tags=["Meeting"],
)
async def delete_meeting(id: int, session: Session = Depends(get_session)):
    try:
        _meeting_service.delete_meeting(id, session)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error deleting meeting {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting meeting",
        )


@router.patch(
    "/meetings/{id}",
    response_model=MeetingResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a meeting",
    tags=["Meeting"],
)
async def update_meeting(
    id: int, meeting_data: UpdateMeetingRequest, session: Session = Depends(get_session)
):
    try:
        return _meeting_service.update_meeting(id, meeting_data, session)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating meeting {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating meeting",
        )
