import tempfile
from typing import List

import whisperx
from sqlalchemy.orm import Session

from ..core.logging import setup_logger
from ..database.repositories.meeting_repo import MeetingRepository
from ..schemas.meeting_schema import (
    CreateMeetingRequest,
    MeetingMetadataResponse,
    MeetingResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)
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
        _logger.debug(f"Processing {len(meetings_list)} meetings")

        if len(meetings_list) != len(audios_bytes):
            raise ValueError(
                "The number of metadata objects must match the number of audio files"
            )

        return [
            self._process_single_meeting(metadata, audio_bytes)
            for metadata, audio_bytes in zip(meetings_list, audios_bytes)
        ]

    def _process_single_meeting(
        self, meeting_metadata: CreateMeetingRequest, audio_bytes: bytes
    ) -> MeetingResponse:
        _logger.debug(f"Processing meeting: {meeting_metadata.title}")

        audio = self._get_audio_from_bytes(audio_bytes)

        transcription = get_transcribed_conversation(
            meeting_metadata,
            audio,
            self.device,
            self.compute_type,
            self.model_size,
        )

        summary = summarize_meeting(transcription)

        return self.repository.create_meeting(meeting_metadata, transcription, summary)

    def _get_audio_from_bytes(self, audio_bytes: bytes):
        with tempfile.NamedTemporaryFile(suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_file.flush()
            return whisperx.load_audio(temp_file.name)

    def get_all_meetings_metadata(self) -> List[MeetingMetadataResponse]:
        _logger.debug("Retrieving all meetings")
        return self.repository.retrieve_all_meetings_metadata()

    def get_meeting_summary(self, id: int) -> MeetingSummaryResponse:
        _logger.debug(f"Retrieving summary of meeting with id={id}")
        return self.repository.retrieve_meeting_summary(id)

    def get_meeting_transcription(self, id: int) -> MeetingTranscriptionResponse:
        _logger.debug(f"Retrieving transcription of meeting with id={id}")
        return self.repository.retrieve_meeting_transcription(id)

    def update_meeting(
        self, id: int, meeting_data: UpdateMeetingMetadata
    ) -> MeetingMetadataResponse:
        _logger.debug(f"Updating meeting with ID: {id}")
        return self.repository.update_meeting_metadata(id, meeting_data)

    def delete_meeting(self, meeting_id: int) -> None:
        _logger.debug(f"Deleting meeting with ID: {meeting_id}")
        self.repository.delete_meeting(meeting_id)
