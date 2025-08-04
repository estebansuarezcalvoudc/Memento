import pymongo
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
        self._collection.insert_one(
            {
                "username": username,
                "title": meeting_metadata.title,
                "date": meeting_metadata.date,
                "summary": summary,
                "transcription": transcription,
            }
        )

    def retrieve_all_meetings_metadata(
        self, username: str
    ) -> list[MeetingMetadataResponse]:
        result = self._collection.find(
            {"usermane": username}, {"_id": True, "title": True, "date": True}
        )

        return [
            MeetingMetadataResponse(
                id=str(meeting_metadata["_id"]),
                title=meeting_metadata["title"],
                date=meeting_metadata["date"],
            )
            for meeting_metadata in result
        ]

    def retrieve_meeting_summary(
        self, id: str, username: str
    ) -> MeetingSummaryResponse:
        result = self._collection.find_one(
            {"username": username, "_id": id}, {"_id": False, "summary": True}
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dialogue with id={id} not found",
            )

        return MeetingSummaryResponse(summary=result["summary"])

    def retrieve_meeting_transcription(
        self, id: str, username: str
    ) -> MeetingTranscriptionResponse:
        result = self._collection.find_one(
            {"username": username, "_id": id}, {"_id": False, "transcription": True}
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
        result = self._collection(
            {"username": username, "_id": ObjectId(id)},
            {"$set": {"title": meeting_data.title, "date": meeting_data.date}},
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
