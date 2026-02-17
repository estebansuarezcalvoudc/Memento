import json
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from ...core.logging import setup_logger
from ...dependencies.auth_dependencies import get_current_active_user
from ...schemas.auth.auth_schema import User
from ...schemas.meeting.meeting_schema import (
    CreateMeetingsBatchRequest,
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)
from ...services.meeting.meeting_service import MeetingService
from ..docs.meeting_docs_loader import create_meetings_docs

_logger = setup_logger(__name__)
router = APIRouter(prefix="/meetings", tags=["Meeting"])


def _parse_meetings_batch_request(
    meetings_data: Annotated[
        str,
        Form(
            description=create_meetings_docs.meetings_batch_description,
            examples=[create_meetings_docs.meetings_batch_example],
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
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create meetings and process them",
    openapi_extra=create_meetings_docs.openapi_extra,
)
async def create_meetings(
    current_user: Annotated[User, Depends(get_current_active_user)],
    batch_request: CreateMeetingsBatchRequest = Depends(_parse_meetings_batch_request),
    audios: list[UploadFile] = File(
        ..., description=create_meetings_docs.audios_file_description
    ),
) -> list[MeetingMetadataResponse]:
    _validate_audio_files(audios)

    try:
        audio_bytes_list = [await audio.read() for audio in audios]

        meeting_service = MeetingService()
        created_meetings = meeting_service.process_meetings(
            batch_request, audio_bytes_list, current_user.username
        )
        return created_meetings
    except HTTPException:
        raise
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
    "",
    status_code=status.HTTP_200_OK,
    summary="Retrieve all meetings",
)
async def retrieve_all_meetings_metadata(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> list[MeetingMetadataResponse]:
    try:
        meeting_service = MeetingService()
        return meeting_service.retrieve_all_meetings_metadata(current_user.username)
    except Exception as e:
        _logger.error(f"Error retrieving meetings: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving meetings",
        )


@router.get(
    "/meetings/summary/{id}",
    status_code=status.HTTP_200_OK,
    summary="Retrieve the summary of a meeting",
)
async def retrieve_meeting_summary(
    id: str, current_user: Annotated[User, Depends(get_current_active_user)]
) -> MeetingSummaryResponse:
    try:
        meeting_service = MeetingService()
        return meeting_service.retrieve_meeting_summary(id, current_user.username)
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
    status_code=status.HTTP_200_OK,
    summary="Retrieve the transcription of a meeting",
)
async def retrieve_meeting_transcription(
    id: str, current_user: Annotated[User, Depends(get_current_active_user)]
) -> MeetingTranscriptionResponse:
    try:
        meeting_service = MeetingService()
        return meeting_service.retrieve_meeting_transcription(id, current_user.username)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error retrieving meeting transcription: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving meeting transcription",
        )


@router.patch(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Update a meeting",
)
async def update_meeting(
    id: str,
    meeting_data: UpdateMeetingMetadata,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> None:
    try:
        meeting_service = MeetingService()
        meeting_service.update_meeting(id, meeting_data, current_user.username)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating meeting {id}: {str(e)}", exc_info=True)
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating meeting",
        )


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a meeting",
)
async def delete_meeting(
    id: str, current_user: Annotated[User, Depends(get_current_active_user)]
) -> None:
    try:
        meeting_service = MeetingService()
        meeting_service.delete_meeting(id, current_user.username)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error deleting meeting {id}: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting meeting",
        )
