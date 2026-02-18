from datetime import datetime
from typing import Optional

import pymongo
from bson import ObjectId
from elasticsearch import Elasticsearch
from fastapi import HTTPException, status

from ..core.logging import setup_logger
from ..core.settings import settings
from ..schemas.meeting.meeting_schema import MeetingMetadata as MeetingMetadataSchema
from ..schemas.meeting.meeting_schema import (
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)
from ..schemas.settings.whisperx_schema import SUPPORTED_LANGUAGES
from .abstract_meeting_repo import MeetingRepository as AbstractMeetingRepository
from .utils.handle_invalid_id import handle_invalid_id

_logger = setup_logger(__name__)


class MeetingMongoRepository(AbstractMeetingRepository):
    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["tfg_db"]
        self._collection = mydb["meetings"]
        self._collection.create_index("username", background=True)

        self._elastic_search = Elasticsearch(
            hosts=[settings.elastic_search_url],
            basic_auth=settings.elastic_search_auth,
            verify_certs=False,
            ssl_show_warn=False,
        )

        self._initialize_elasticsearch_indexes()

    def _initialize_elasticsearch_indexes(self) -> None:
        """Initialize Elasticsearch indexes for different languages."""

        index_mapping = {
            "mappings": {
                "properties": {
                    "username": {"type": "keyword"},
                    "title": {"type": "text", "analyzer": "standard"},
                    "date": {"type": "date", "format": "yyyy-MM-dd"},
                    "summary": {"type": "text", "analyzer": "standard"},
                    "transcription": {"type": "text", "analyzer": "standard"},
                }
            }
        }

        for language in SUPPORTED_LANGUAGES:
            index_name = f"meetings_{language}"
            try:
                if not self._elastic_search.indices.exists(index=index_name):
                    self._elastic_search.indices.create(
                        index=index_name, body=index_mapping
                    )
            except Exception as e:
                _logger.warning(f"Warning: Could not create index {index_name}: {e}")

    def store_meeting(
        self,
        meeting_metadata: MeetingMetadataSchema,
        summary: str,
        transcription: str,
        username: str,
    ) -> MeetingMetadataResponse:
        # Convert date to datetime for MongoDB compatibility
        meeting_date_mongo = datetime.combine(
            meeting_metadata.date, datetime.min.time()
        )

        result = self._collection.insert_one(
            {
                "username": username,
                "title": meeting_metadata.title,
                "date": meeting_date_mongo,
                "language": meeting_metadata.language,
                "summary": summary,
                "transcription": transcription,
            }
        )

        try:
            self._elastic_search.index(
                index=f"meetings_{meeting_metadata.language}",
                id=result.inserted_id,
                document={
                    "username": username,
                    "title": meeting_metadata.title,
                    "date": str(meeting_metadata.date),
                    "summary": summary,
                    "transcription": transcription,
                },
            )
        except Exception as e:
            self._collection.delete_one({"_id": result.inserted_id})
            _logger.error(
                f"Failed to index meeting in elastic search, rolled back MongoDB insert: {str(e)}"
            )
            raise e

        return MeetingMetadataResponse(
            id=str(result.inserted_id),
            title=meeting_metadata.title,
            date=meeting_metadata.date,
            language=meeting_metadata.language,
        )

    def retrieve_all_meetings_metadata(
        self, username: str
    ) -> list[MeetingMetadataResponse]:
        result = self._collection.find(
            {"username": username},
            {"_id": True, "title": True, "date": True, "language": True},
        )

        return [
            MeetingMetadataResponse(
                id=str(meeting_metadata["_id"]),
                title=meeting_metadata["title"],
                date=meeting_metadata["date"].date(),  # Convert datetime back to date
                language=meeting_metadata.get("language"),
            )
            for meeting_metadata in result
        ]

    @handle_invalid_id
    def retrieve_meeting_summary(
        self, id: str, username: str
    ) -> MeetingSummaryResponse:
        result = self._collection.find_one(
            {"username": username, "_id": ObjectId(id)},
            {"_id": False, "summary": True, "title": True, "date": True},
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} for user={username} not found",
            )

        return MeetingSummaryResponse(
            summary=result["summary"], title=result["title"], date=result["date"]
        )

    @handle_invalid_id
    def retrieve_meeting_transcription(
        self, id: str, username: str
    ) -> MeetingTranscriptionResponse:
        result = self._collection.find_one(
            {"username": username, "_id": ObjectId(id)},
            {"_id": False, "transcription": True, "title": True, "date": True},
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} not found",
            )

        return MeetingTranscriptionResponse(
            transcription=result["transcription"],
            title=result["title"],
            date=result["date"],
        )

    @handle_invalid_id
    def update_meeting_metadata(
        self, id: str, new_meeting_metadata: UpdateMeetingMetadata, username: str
    ) -> None:
        previous_data = self._collection.find_one(
            {"username": username, "_id": ObjectId(id)},
            {"_id": False, "title": True, "date": True, "language": True},
        )

        if not previous_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} not found",
            )

        update_data_mongo, update_data_elastic_search = self._get_update_data(
            new_meeting_metadata
        )
        if not update_data_mongo:
            return

        self._update_mongo_meeting(id, username, update_data_mongo)
        try:
            self._update_elastic_meeting(
                id, previous_data["language"], update_data_elastic_search
            )
        except Exception as e:
            self._rollback_mongo_update(id, username, previous_data)
            _logger.error(
                f"Failed to update meeting with id={id} in Elasticsearch: {str(e)}"
            )
            raise e

    def _update_mongo_meeting(self, id: str, username: str, update_data: dict) -> None:
        self._collection.update_one(
            {"username": username, "_id": ObjectId(id)},
            {"$set": update_data},
        )

    def _update_elastic_meeting(
        self, id: str, language: str, update_data: dict
    ) -> None:
        self._elastic_search.update(
            index=f"meetings_{language}",
            id=id,
            doc=update_data,
        )

    def _rollback_mongo_update(
        self, id: str, username: str, previous_data: dict
    ) -> None:
        self._collection.update_one(
            {"username": username, "_id": ObjectId(id)},
            {"$set": previous_data},
        )

    def _get_update_data(
        self, meeting_data: UpdateMeetingMetadata
    ) -> tuple[dict, dict]:
        update_data_mongo = {}
        update_data_elastic_search = {}
        if meeting_data.title is not None:
            update_data_mongo["title"] = meeting_data.title
            update_data_elastic_search["title"] = meeting_data.title
        if meeting_data.date is not None:
            update_data_mongo["date"] = datetime.combine(
                meeting_data.date, datetime.min.time()
            )
            update_data_elastic_search["date"] = meeting_data.date

        return update_data_mongo, update_data_elastic_search

    def _get_meeting_language(self, id: str, username: str) -> Optional[str]:
        current_meeting = self._collection.find_one(
            {"username": username, "_id": ObjectId(id)},
            {"_id": False, "language": True},
        )

        if not current_meeting:
            return None

        return current_meeting["language"]

    @handle_invalid_id
    def delete_meeting(self, id: str, username: str) -> None:
        meeting_language = self._get_meeting_language(id, username)

        if not meeting_language:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} not found",
            )

        self._collection.delete_one({"username": username, "_id": ObjectId(id)})
        self._elastic_search.delete(index=f"meetings_{meeting_language}", id=id)
