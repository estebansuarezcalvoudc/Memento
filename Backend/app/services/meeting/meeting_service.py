from typing import AsyncIterable

from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.schemas.meeting.meeting_events import (
    JobFinished,
    JobStarted,
    MeetingProcessingFailed,
    MeetingProcessingStarted,
    MeetingProcessingSucceeded,
    MeetingUploadEvent,
)

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
from ...services.transcription.interfaces.transcription_service import (
    TranscriptionService,
)
from ...utils.singleton_meta import SingletonMeta
from .meeting_processing.summarization import get_meeting_summary

_logger = setup_logger(__name__)

_TEXT_SPLITTER = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)


class MeetingService(metaclass=SingletonMeta):
    def __init__(
        self,
        repository: MeetingRepository,
        transcription_service: TranscriptionService,
        vector_store: VectorStore,
    ) -> None:
        self._repository: MeetingRepository = repository
        self._transcription_service = transcription_service
        self._vector_store = vector_store

    async def process_meetings(
        self,
        batch_request: CreateMeetingsBatchRequest,
        audio_bytes_list: list[bytes],
        user_id: str,
    ) -> AsyncIterable[MeetingUploadEvent]:
        yield JobStarted(total_meetings=len(batch_request.meetings_metadata))

        meetings = zip(batch_request.meetings_metadata, audio_bytes_list)

        succeeded = 0
        failed = 0

        for i, (metadata, audio_bytes) in enumerate(meetings):
            yield MeetingProcessingStarted(index=i, title=metadata.title)

            try:
                created_meeting = self._process_single_meeting(
                    metadata,
                    audio_bytes,
                    batch_request.processing_configuration,
                    user_id,
                )
                succeeded += 1
                yield MeetingProcessingSucceeded(
                    index=i, title=metadata.title, meeting_id=created_meeting.id
                )
            except Exception as e:
                failed += 1
                yield MeetingProcessingFailed(
                    index=i, title=metadata.title, error=str(e)
                )

        yield JobFinished(meetings_succeeded=succeeded, meetings_failed=failed)

    def _process_single_meeting(
        self,
        meeting_metadata: MeetingMetadata,
        audio_bytes: bytes,
        processing_config: ProcessingConfiguration,
        user_id: str,
    ) -> MeetingMetadataResponse:
        result = self._transcription_service.transcribe(
            audio_bytes, meeting_metadata.language, user_id
        )
        meeting_metadata.language = result.language

        summary = get_meeting_summary(result.text, processing_config, user_id)

        created_meeting = self._repository.store_meeting(
            meeting_metadata, summary, result.text, user_id
        )

        self._index_meeting(
            created_meeting.id, meeting_metadata, summary, result.text, user_id
        )

        return created_meeting

    def _index_meeting(
        self,
        meeting_id: str,
        meeting_metadata: MeetingMetadata,
        summary: str,
        transcription: str,
        user_id: str,
    ) -> None:
        base_metadata = {
            "meeting_id": meeting_id,
            "user_id": user_id,
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
        self, user_id: str
    ) -> list[MeetingMetadataResponse]:
        return self._repository.retrieve_all_meetings_metadata(user_id)

    def retrieve_meeting_summary(self, id: str, user_id: str) -> MeetingSummaryResponse:
        return self._repository.retrieve_meeting_summary(id, user_id)

    def retrieve_meeting_transcription(
        self, id: str, user_id: str
    ) -> MeetingTranscriptionResponse:
        return self._repository.retrieve_meeting_transcription(id, user_id)

    def update_meeting(
        self, id: str, meeting_data: UpdateMeetingMetadata, user_id: str
    ) -> None:
        self._repository.update_meeting_metadata(id, meeting_data, user_id)
        self._update_vector_store_metadata(id, meeting_data)

    def _update_vector_store_metadata(
        self, meeting_id: str, meeting_data: UpdateMeetingMetadata
    ) -> None:
        updates = meeting_data.model_dump(exclude_none=True)
        if not updates:
            return
        if "date" in updates:
            updates["date"] = str(updates["date"])

        result = self._vector_store._collection.get(where={"meeting_id": meeting_id})
        if not result["ids"]:
            return

        updated_metadatas = [{**meta, **updates} for meta in result["metadatas"]]
        self._vector_store._collection.update(
            ids=result["ids"], metadatas=updated_metadatas
        )
        _logger.debug(
            f"Updated vector store metadata for meeting {meeting_id}: {updates}"
        )

    def delete_meeting(self, meeting_id: str, user_id: str) -> None:
        self._repository.delete_meeting(meeting_id, user_id)
        self._vector_store.delete(where={"meeting_id": meeting_id})
