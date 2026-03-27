import asyncio
from typing import AsyncIterable

from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.repositories.interfaces.settings_repo import SettingsRepository
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
    MeetingMetadata,
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)
from ...services.settings.transcription_providers_service import (
    TranscriptionProvidersService,
)
from ...utils.singleton_meta import SingletonMeta
from .meeting_processing.summarization import get_meeting_summary

_logger = setup_logger(__name__)

_TEXT_SPLITTER = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)


class MeetingService(metaclass=SingletonMeta):
    def __init__(
        self,
        meetings_repository: MeetingRepository,
        settings_repository: SettingsRepository,
        transcription_providers_service: TranscriptionProvidersService,
        vector_store: VectorStore,
    ) -> None:
        self._meeting_repository: MeetingRepository = meetings_repository
        self._settings_repository: SettingsRepository = settings_repository
        self._transcription_providers_service = transcription_providers_service
        self._vector_store = vector_store

    async def process_meetings(
        self,
        meetings_metadata: list[MeetingMetadata],
        audio_bytes_list: list[bytes],
        user_id: str,
    ) -> AsyncIterable[MeetingUploadEvent]:
        number_of_meetings = len(meetings_metadata)

        yield JobStarted(total_meetings=number_of_meetings)
        _logger.info(f"JobStarted - {number_of_meetings} meetings")

        meetings = zip(meetings_metadata, audio_bytes_list)

        succeeded = 0
        failed = 0

        for i, (metadata, audio_bytes) in enumerate(meetings):
            yield MeetingProcessingStarted(index=i, title=metadata.title)
            _logger.info(f"Meeting processing started - meeting {i} - {metadata.title}")

            try:
                created_meeting = await asyncio.to_thread(
                    self._process_single_meeting,
                    metadata,
                    audio_bytes,
                    user_id,
                )
                succeeded += 1
                yield MeetingProcessingSucceeded(
                    index=i, title=metadata.title, meeting_id=created_meeting.id
                )
                _logger.info(
                    f"Meeting processing succeeded - meeting {i} - {metadata.title}"
                )
            except Exception:
                failed += 1
                yield MeetingProcessingFailed(
                    index=i,
                    title=metadata.title,
                    error="An unexpected error occurred while processing this meeting.",
                )

                _logger.exception(
                    "Meeting processing failed - meeting %s - %s", i, metadata.title
                )

        yield JobFinished(meetings_succeeded=succeeded, meetings_failed=failed)
        _logger.info(f"Job finished - {number_of_meetings} meetings")

    def _process_single_meeting(
        self,
        meeting_metadata: MeetingMetadata,
        audio_bytes: bytes,
        user_id: str,
    ) -> MeetingMetadataResponse:
        transcription_service = (
            self._transcription_providers_service.get_transcription_service_for_user(
                user_id
            )
        )
        result = transcription_service.transcribe(
            audio_bytes,
            meeting_metadata.language,
            meeting_metadata.number_of_speakers,
            user_id,
        )
        meeting_metadata.language = result.language

        summary = get_meeting_summary(result.text, self._settings_repository, user_id)

        created_meeting = self._meeting_repository.store_meeting(
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
        return self._meeting_repository.retrieve_all_meetings_metadata(user_id)

    def retrieve_meeting_summary(self, id: str, user_id: str) -> MeetingSummaryResponse:
        return self._meeting_repository.retrieve_meeting_summary(id, user_id)

    def retrieve_meeting_transcription(
        self, id: str, user_id: str
    ) -> MeetingTranscriptionResponse:
        return self._meeting_repository.retrieve_meeting_transcription(id, user_id)

    def update_meeting(
        self, id: str, meeting_data: UpdateMeetingMetadata, user_id: str
    ) -> None:
        self._meeting_repository.update_meeting_metadata(id, meeting_data, user_id)
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
        self._meeting_repository.delete_meeting(meeting_id, user_id)
        self._vector_store.delete(where={"meeting_id": meeting_id})
