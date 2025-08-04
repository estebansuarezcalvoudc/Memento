import tempfile

import whisperx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..database.repositories.meeting_repo import MeetingRepository
from ..schemas.meeting_schema import (
    CreateMeetingsBatchRequest,
    MeetingMetadata,
    MeetingMetadataResponse,
    MeetingResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    ProcessingConfiguration,
    UpdateMeetingMetadata,
)
from .meeting_processing.gpu_utils import get_device
from .meeting_processing.summarization import get_meeting_summary
from .meeting_processing.transcription import get_transcribed_conversation


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

    def process_meetings(
        self,
        batch_request: CreateMeetingsBatchRequest,
        audio_bytes_list: list[bytes],
        username: str,
    ) -> list[MeetingResponse]:
        if len(batch_request.meetings_metadata) != len(audio_bytes_list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The number of metadata objects must match the number of audio files",
            )

        return [
            self._process_single_meeting(
                metadata, audio_bytes, batch_request.processing_configuration, username
            )
            for metadata, audio_bytes in zip(
                batch_request.meetings_metadata, audio_bytes_list
            )
        ]

    def _process_single_meeting(
        self,
        meeting_metadata: MeetingMetadata,
        audio_bytes: bytes,
        processing_config: ProcessingConfiguration,
        username: str,
    ) -> MeetingResponse:
        audio = self._get_audio_from_bytes(audio_bytes)

        transcription = get_transcribed_conversation(
            meeting_metadata,
            audio,
            self.device,
            self.compute_type,
            self.model_size,
        )

        summary = get_meeting_summary(
            transcription,
            language_model=processing_config.language_model,
            prompt=processing_config.prompt,
            options=processing_config.options,
        )

        return self.repository.store_meeting(
            meeting_metadata, transcription, summary, username
        )

    def _get_audio_from_bytes(self, audio_bytes: bytes):
        with tempfile.NamedTemporaryFile(suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_file.flush()
            return whisperx.load_audio(temp_file.name)

    def retrieve_all_meetings_metadata(
        self, username: str
    ) -> list[MeetingMetadataResponse]:
        return self.repository.retrieve_all_meetings_metadata()

    def retrieve_meeting_summary(
        self, id: int, username: str
    ) -> MeetingSummaryResponse:
        return self.repository.retrieve_meeting_summary(id)

    def retrieve_meeting_transcription(
        self, id: int, username: str
    ) -> MeetingTranscriptionResponse:
        return self.repository.retrieve_meeting_transcription(id)

    def update_meeting(
        self, id: int, meeting_data: UpdateMeetingMetadata, username: str
    ) -> None:
        self.repository.update_meeting_metadata(id, meeting_data)

    def delete_meeting(self, meeting_id: int, username: str) -> None:
        self.repository.delete_meeting(meeting_id)
