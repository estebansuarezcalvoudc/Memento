import json
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..core.logging import setup_logger
from ..database.config import get_db_session
from ..schemas.meeting_schema import (
    CreateMeetingsBatchRequest,
    MeetingMetadataResponse,
    MeetingResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)
from ..services.meeting_service import MeetingService
from .docs.meeting_docs_loader import create_meetings_docs

_logger = setup_logger(__name__)
router = APIRouter()


def _parse_meetings_batch_request(
    meetings_data: Annotated[
        str,
        Form(
            description=create_meetings_docs.meetings_metadata_form_description,
            example=create_meetings_docs.meetings_metadata_form_example,
        ),
    ],
) -> CreateMeetingsBatchRequest:
    try:
        batch_data = json.loads(meetings_data)
        return CreateMeetingsBatchRequest(**batch_data)
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
    batch_request: CreateMeetingsBatchRequest = Depends(_parse_meetings_batch_request),
    audios: list[UploadFile] = File(
        ..., description=create_meetings_docs.audios_file_description
    ),
    session: Session = Depends(get_db_session),
):
    _logger.debug("Create meetings was called")

    _validate_audio_files(audios)

    try:
        audio_bytes_list = [await audio.read() for audio in audios]

        meeting_service = MeetingService(session)
        return meeting_service.create_meetings(batch_request, audio_bytes_list)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        _logger.error(f"Error creating meetings: {str(e)}", exc_info=True)
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating meetings",
        )


def _validate_audio_files(audio_files: list[UploadFile]) -> None:
    """
    Validate that all uploaded files are in supported audio formats.

    Args:
        audio_files: List of uploaded files to validate

    Raises:
        HTTPException: If any file has an unsupported format
    """
    supported_file_formats = {"mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"}

    for file in audio_files:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file must have a filename",
            )

        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in supported_file_formats:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported audio format: {file_extension}. "
                f"Supported formats: {', '.join(sorted(supported_file_formats))}",
            )

        if not file.content_type or not file.content_type.startswith("audio/"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="The uploaded file is not an audio file",
            )


@router.get(
    "/meetings",
    response_model=list[MeetingMetadataResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve all meetings",
    tags=["Meeting"],
)
async def retrieve_all_meetings_metadata(session: Session = Depends(get_db_session)):
    try:
        meeting_service = MeetingService(session)
        return meeting_service.get_all_meetings_metadata()
    except Exception as e:
        _logger.error(f"Error retrieving meetings: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving meetings",
        )


@router.get(
    "/meetings/summary/{id}",
    response_model=MeetingSummaryResponse,
    summary="Retrieve the summary of a meeting",
    tags=["Meeting"],
)
async def retrieve_meeting_summary(id: int, session: Session = Depends(get_db_session)):
    try:
        meeting_service = MeetingService(session)
        return meeting_service.get_meeting_summary(id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error retrieving meeting summary: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving meeting summary",
        )


@router.get(
    "/meetings/transcription/{id}",
    response_model=MeetingTranscriptionResponse,
    summary="Retrieve the transcription of a meeting",
    tags=["Meeting"],
)
async def retrieve_meeting_transcription(
    id: int, session: Session = Depends(get_db_session)
):
    try:
        meeting_service = MeetingService(session)
        return meeting_service.get_meeting_transcription(id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error retrieving meeting transcription: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving meeting transcription",
        )


@router.delete(
    "/meetings/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a meeting",
    tags=["Meeting"],
)
async def delete_meeting(id: int, session: Session = Depends(get_db_session)):
    try:
        meeting_service = MeetingService(session)
        meeting_service.delete_meeting(id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error deleting meeting {id}: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting meeting",
        )


@router.patch(
    "/meetings/{id}",
    response_model=MeetingMetadataResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a meeting",
    tags=["Meeting"],
)
async def update_meeting(
    id: int,
    meeting_data: UpdateMeetingMetadata,
    session: Session = Depends(get_db_session),
):
    try:
        meeting_service = MeetingService(session)
        return meeting_service.update_meeting(id, meeting_data)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating meeting {id}: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating meeting",
        )
