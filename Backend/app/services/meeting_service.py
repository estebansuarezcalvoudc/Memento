import tempfile

import whisperx
from fastapi import HTTPException, status

from ..repositories.meeting_repo import MeetingRepository
from ..schemas.meeting_schema import (
    CreateMeetingsBatchRequest,
    MeetingMetadata,
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    ProcessingConfiguration,
    UpdateMeetingMetadata,
)
from ..utils.singleton_meta import SingletonMeta
from .meeting_processing.gpu_utils import get_device
from .meeting_processing.summarization import get_meeting_summary
from .meeting_processing.transcription import get_transcribed_conversation


class MeetingService(metaclass=SingletonMeta):
    """
    Service layer for meeting operations.
    Handles all business logic and communicates with the repository layer.
    """

    def __init__(self) -> None:
        self._repository = MeetingRepository()
        self._device = get_device()
        self._compute_type = "int8"
        self._model_size = "tiny"

    def process_meetings(
        self,
        batch_request: CreateMeetingsBatchRequest,
        audio_bytes_list: list[bytes],
        username: str,
    ) -> list[MeetingMetadataResponse]:
        if len(batch_request.meetings_metadata) != len(audio_bytes_list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The number of metadata objects must match the number of audio files",
            )

        created_meetings = []
        for metadata, audio_bytes in zip(
            batch_request.meetings_metadata, audio_bytes_list
        ):
            created_meeting = self._process_single_meeting(
                metadata, audio_bytes, batch_request.processing_configuration, username
            )
            created_meetings.append(created_meeting)

        return created_meetings

    def _process_single_meeting(
        self,
        meeting_metadata: MeetingMetadata,
        audio_bytes: bytes,
        processing_config: ProcessingConfiguration,
        username: str,
    ) -> MeetingMetadataResponse:
        audio = self._get_audio_from_bytes(audio_bytes)

        transcription, meeting_metadata.language = get_transcribed_conversation(
            meeting_metadata,
            audio,
            self._device,
            self._compute_type,
            self._model_size,
        )

        summary = get_meeting_summary(transcription, processing_config, username)

        created_meeting = self._repository.store_meeting(
            meeting_metadata, summary, transcription, username
        )

        return created_meeting

    def _get_audio_from_bytes(self, audio_bytes: bytes):
        with tempfile.NamedTemporaryFile(suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_file.flush()
            return whisperx.load_audio(temp_file.name)

    def retrieve_all_meetings_metadata(
        self, username: str
    ) -> list[MeetingMetadataResponse]:
        return self._repository.retrieve_all_meetings_metadata(username)

    def retrieve_meeting_summary(
        self, id: str, username: str
    ) -> MeetingSummaryResponse:
        return self._repository.retrieve_meeting_summary(id, username)

    def retrieve_meeting_transcription(
        self, id: str, username: str
    ) -> MeetingTranscriptionResponse:
        return self._repository.retrieve_meeting_transcription(id, username)

    def update_meeting(
        self, id: str, meeting_data: UpdateMeetingMetadata, username: str
    ) -> None:
        self._repository.update_meeting_metadata(id, meeting_data, username)

    def delete_meeting(self, meeting_id: str, username: str) -> None:
        self._repository.delete_meeting(meeting_id, username)
