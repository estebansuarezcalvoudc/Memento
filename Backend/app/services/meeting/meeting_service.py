from fastapi import HTTPException, status
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

from ...core.logging import setup_logger
from ...repositories.interfaces.meeting_repo import MeetingRepository
from ...schemas.meeting.meeting_schema import (
    CreateMeetingsBatchRequest,
    MeetingMetadata,
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    ProcessingConfiguration,
    UpdateMeetingMetadata,
)
from ...services.transcription.interfaces.transcription_service import TranscriptionService
from ...utils.singleton_meta import SingletonMeta
from .meeting_processing.summarization import get_meeting_summary

_logger = setup_logger(__name__)

_TEXT_SPLITTER = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)


class MeetingService(metaclass=SingletonMeta):
    def __init__(self, repository: MeetingRepository, transcription_service: TranscriptionService, vector_store: VectorStore) -> None:
        self._repository: MeetingRepository = repository
        self._transcription_service = transcription_service
        self._vector_store = vector_store

    def process_meetings(
        self,
        batch_request: CreateMeetingsBatchRequest,
        audio_bytes_list: list[bytes],
        username: str,
    ) -> list[MeetingMetadataResponse]:
        if len(batch_request.meetings_metadata) != len(audio_bytes_list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
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
        result = self._transcription_service.transcribe(
            audio_bytes, meeting_metadata.language, username
        )
        meeting_metadata.language = result.language

        summary = get_meeting_summary(result.text, processing_config, username)

        created_meeting = self._repository.store_meeting(
            meeting_metadata, summary, result.text, username
        )

        self._index_meeting(created_meeting.id, meeting_metadata, summary, result.text, username)

        return created_meeting

    def _index_meeting(
        self,
        meeting_id: str,
        meeting_metadata: MeetingMetadata,
        summary: str,
        transcription: str,
        username: str,
    ) -> None:
        base_metadata = {
            "meeting_id": meeting_id,
            "username": username,
            "title": meeting_metadata.title,
            "date": str(meeting_metadata.date),
        }

        chunks = _TEXT_SPLITTER.create_documents(
            [transcription],
            metadatas=[{**base_metadata, "type": "transcription"}],
        )
        summary_doc = Document(
            page_content=summary,
            metadata={**base_metadata, "type": "summary"},
        )

        ids = [f"{meeting_id}_t{i}" for i in range(len(chunks))] + [f"{meeting_id}_s"]
        self._vector_store.add_documents(chunks + [summary_doc], ids=ids)
        _logger.debug(f"Indexed meeting {meeting_id} ({len(chunks)} chunks + summary)")

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
        self._vector_store.delete(where={"meeting_id": meeting_id})
