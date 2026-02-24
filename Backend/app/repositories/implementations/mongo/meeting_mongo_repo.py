from datetime import datetime
from typing import Optional

import pymongo
from bson import ObjectId
from fastapi import HTTPException, status

from ....core.settings import settings
from ....schemas.meeting.meeting_schema import MeetingMetadata as MeetingMetadataSchema
from ....schemas.meeting.meeting_schema import (
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)
from ...interfaces.meeting_repo import MeetingRepository as AbstractMeetingRepository
from .utils.handle_invalid_id import handle_invalid_id


class MeetingMongoRepository(AbstractMeetingRepository):
    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["tfg_db"]
        self._collection = mydb["meetings"]
        self._collection.create_index("username", background=True)

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

        update_data = {}

        if new_meeting_metadata.title is not None:
            update_data["title"] = new_meeting_metadata.title

        if new_meeting_metadata.date is not None:
            update_data["date"] = datetime.combine(
                new_meeting_metadata.date, datetime.min.time()
            )

        self._collection.update_one(
            {"username": username, "_id": ObjectId(id)},
            {"$set": update_data},
        )

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
        self._collection.delete_one({"username": username, "_id": ObjectId(id)})
