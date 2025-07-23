import tempfile
from typing import List

import whisperx
from sqlalchemy.orm import Session

from ..core.logging import setup_logger
from ..database.repositories.meeting_repo import MeetingRepository
from ..schemas.meeting_schema import (
    CreateMeetingRequest,
    MeetingResponse,
    UpdateMeetingRequest,
)
from ..utils.log_execution_time import log_execution_time
from .meeting_processing.gpu_utils import get_device
from .meeting_processing.summarization import summarize_meeting
from .meeting_processing.transcription import get_transcribed_conversation

_logger = setup_logger(__name__)


class MeetingService:
    """
    Service layer for meeting operations.
    Handles all business logic and communicates with the repository layer.
    """

    def __init__(self, session: Session):
        self.repository = MeetingRepository(session)
        self.device = get_device()
        self.compute_type = "int8"
        self.model_size = "tiny"

    def create_meetings(
        self,
        meetings_list: List[CreateMeetingRequest],
        audios_bytes: List[bytes],
    ) -> List[MeetingResponse]:
        """
        Process and create multiple meetings with their audio files.

        Args:
            meetings_list: List of meeting metadata
            audios_bytes: List of audio files as bytes

        Returns:
            List of created meeting responses
        """
        _logger.debug(f"Processing {len(meetings_list)} meetings")

        if len(meetings_list) != len(audios_bytes):
            raise ValueError(
                "The number of metadata objects must match the number of audio files"
            )

        results = []
        for metadata, audio_bytes in zip(meetings_list, audios_bytes):
            result = self._process_single_meeting(metadata, audio_bytes)
            results.append(result)

        return results

    def _process_single_meeting(
        self, meeting: CreateMeetingRequest, audio_bytes: bytes
    ) -> MeetingResponse:
        """
        Process a single meeting: transcribe audio, generate summary, and save to database.

        Args:
            meeting: Meeting metadata
            audio_bytes: Audio file as bytes

        Returns:
            Created meeting response
        """
        _logger.debug(f"Processing meeting: {meeting.title}")

        audio = self._get_audio_from_bytes(audio_bytes)

        transcription = log_execution_time(
            get_transcribed_conversation,
            meeting,
            audio,
            self.device,
            self.compute_type,
            self.model_size,
        )

        summary = log_execution_time(summarize_meeting, transcription)

        return self.repository.create_meeting(meeting, transcription, summary)

    def _get_audio_from_bytes(self, audio_bytes: bytes):
        """
        Convert audio bytes to whisperx audio format.

        Args:
            audio_bytes: Audio file as bytes

        Returns:
            Loaded audio for whisperx processing
        """
        with tempfile.NamedTemporaryFile(suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_file.flush()
            return whisperx.load_audio(temp_file.name)

    def get_all_meetings(self) -> List[MeetingResponse]:
        """
        Retrieve all meetings from the database.

        Returns:
            List of all meetings
        """
        _logger.debug("Retrieving all meetings")
        return self.repository.retrieve_all_meetings()

    def update_meeting(
        self, meeting_id: int, meeting_data: UpdateMeetingRequest
    ) -> MeetingResponse:
        """
        Update an existing meeting.

        Args:
            meeting_id: ID of the meeting to update
            meeting_data: Updated meeting data

        Returns:
            Updated meeting response
        """
        _logger.debug(f"Updating meeting with ID: {meeting_id}")
        return self.repository.update_meeting_by_id(meeting_id, meeting_data)

    def delete_meeting(self, meeting_id: int) -> None:
        """
        Delete a meeting by ID.

        Args:
            meeting_id: ID of the meeting to delete
        """
        _logger.debug(f"Deleting meeting with ID: {meeting_id}")
        self.repository.delete_meeting(meeting_id)
