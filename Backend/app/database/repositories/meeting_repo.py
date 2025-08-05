import pymongo
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from ...core.settings import settings
from ...schemas.meeting_schema import MeetingMetadata as MeetingMetadataSchema
from ...schemas.meeting_schema import (
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)


class MeetingRepository:
    """
    Repository layer for meeting database operations.
    Handles all database interactions for meetings.
    """

    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["meetings_db"]
        self._collection = mydb["meetings"]
        self._collection.create_index("username", background=True)

    def store_meeting(
        self,
        meeting_metadata: MeetingMetadataSchema,
        summary: str,
        transcription: str,
        username: str,
    ) -> None:
        # Convert date to datetime for MongoDB compatibility
        meeting_date = datetime.combine(meeting_metadata.date, datetime.min.time())

        self._collection.insert_one(
            {
                "username": username,
                "title": meeting_metadata.title,
                "date": meeting_date,
                "summary": summary,
                "transcription": transcription,
            }
        )

    def retrieve_all_meetings_metadata(
        self, username: str
    ) -> list[MeetingMetadataResponse]:
        result = self._collection.find(
            {"username": username}, {"_id": True, "title": True, "date": True}
        )

        return [
            MeetingMetadataResponse(
                id=str(meeting_metadata["_id"]),
                title=meeting_metadata["title"],
                date=meeting_metadata["date"].date(),  # Convert datetime back to date
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
                detail=f"Dialogue with id={id} for user={username} not found",
            )

        return MeetingSummaryResponse(summary=result["summary"])

    def retrieve_meeting_transcription(
        self, id: str, username: str
    ) -> MeetingTranscriptionResponse:
        result = self._collection.find_one(
            {"username": username, "_id": ObjectId(id)}, {"_id": False, "transcription": True}
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dialogue with id={id} not found",
            )

        return MeetingTranscriptionResponse(transcription=result["transcription"])

    def update_meeting_metadata(
        self, id: str, meeting_data: UpdateMeetingMetadata, username: str
    ) -> None:
        update_data = {}
        if meeting_data.title is not None:
            update_data["title"] = meeting_data.title
        if meeting_data.date is not None:
            update_data["date"] = datetime.combine(
                meeting_data.date, datetime.min.time()
            )

        if not update_data:
            return  # Nothing to update

        result = self._collection.update_one(
            {"username": username, "_id": ObjectId(id)},
            {"$set": update_data},
        )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with id={id} not found",
            )

    def delete_meeting(self, id: str, username) -> None:
        result = self._collection.delete_one(
            {"username": username, "_id": ObjectId(id)}
        )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with id={id} not found",
            )
