from typing import Optional
import pymongo
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from ..core.settings import settings
from ..schemas.meeting_schema import MeetingMetadata as MeetingMetadataSchema
from ..schemas.meeting_schema import (
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)

from .utils.handle_invalid_id import handle_invalid_id
from elasticsearch import Elasticsearch


class MeetingRepository:
    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["meetings_db"]
        self._collection = mydb["meetings"]
        self._collection.create_index("username", background=True)

        self._elastic_search = Elasticsearch(
            hosts=[settings.elastic_search_url],
            basic_auth=settings.elastic_search_auth,
            verify_certs=False,
            ssl_show_warn=False,
        )

        # Initialize indexes for supported languages
        self._initialize_indexes()

    def _initialize_indexes(self) -> None:
        """Initialize Elasticsearch indexes for different languages."""
        supported_languages = [
            "en",
            "es",
            "fr",
            "de",
            "it",
            "pt",
        ]  # Add more languages as needed

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

        for language in supported_languages:
            index_name = f"meetings_{language}"
            try:
                if not self._elastic_search.indices.exists(index=index_name):
                    self._elastic_search.indices.create(
                        index=index_name, body=index_mapping
                    )
            except Exception as e:
                # Log the error but don't fail the initialization
                print(f"Warning: Could not create index {index_name}: {e}")

    def store_meeting(
        self,
        meeting_metadata: MeetingMetadataSchema,
        summary: str,
        transcription: str,
        username: str,
    ) -> None:
        # Convert date to datetime for MongoDB compatibility
        meeting_date = datetime.combine(meeting_metadata.date, datetime.min.time())

        result = self._collection.insert_one(
            {
                "username": username,
                "title": meeting_metadata.title,
                "date": meeting_date,
                "language": meeting_metadata.language,
                "summary": summary,
                "transcription": transcription,
            }
        )

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

    def retrieve_meeting_summary(
        self, id: str, username: str
    ) -> MeetingSummaryResponse:
        result = self._collection.find_one(
            {"username": username, "_id": ObjectId(id)}, {"_id": False, "summary": True}
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} for user={username} not found",
            )

        return MeetingSummaryResponse(summary=result["summary"])

    def retrieve_meeting_transcription(
        self, id: str, username: str
    ) -> MeetingTranscriptionResponse:
        result = self._collection.find_one(
            {"username": username, "_id": ObjectId(id)},
            {"_id": False, "transcription": True},
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} not found",
            )

        return MeetingTranscriptionResponse(transcription=result["transcription"])

    @handle_invalid_id
    def update_meeting_metadata(
        self, id: str, meeting_data: UpdateMeetingMetadata, username: str
    ) -> None:
        update_data = self._get_update_data(meeting_data)

        if not update_data:
            return

        meeting_language = self._get_meeting_language(id, username)

        if not meeting_language:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} not found",
            )

        self._collection.update_one(
            {"username": username, "_id": ObjectId(id)},
            {"$set": update_data},
        )
        self._elastic_search.update(
            index=f"meetings_{meeting_language}", id=id, doc=update_data
        )

    def _get_update_data(self, meeting_data: UpdateMeetingMetadata) -> Optional[dict]:
        update_data = {}
        if meeting_data.title is not None:
            update_data["title"] = meeting_data.title
        if meeting_data.date is not None:
            update_data["date"] = datetime.combine(
                meeting_data.date, datetime.min.time()
            )

        return update_data

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
