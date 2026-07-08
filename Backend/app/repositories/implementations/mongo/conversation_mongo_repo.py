from datetime import datetime
from typing import Optional

import pymongo
from bson import ObjectId
from fastapi import HTTPException, status

from ....schemas.conversation.conversation_schema import (
    ConversationCreateResponse,
    ConversationDialogueRetrieve,
    ConversationMetadataRetrieve,
    ConversationStreamState,
    ConversationUpdateRequest,
    StreamStatus,
)
from ...interfaces.conversation_repo import (
    ConversationRepository as AbstractConversationRepository,
)
from .mongo_client import get_mongo_database
from .utils.handle_invalid_id import handle_invalid_id


class ConversationMongoRepository(AbstractConversationRepository):
    def __init__(self):
        mydb = get_mongo_database()
        self._collection = mydb["conversations"]
        self._collection.create_index(
            [("user_id", pymongo.ASCENDING), ("updated_at", pymongo.DESCENDING)],
            background=True,
        )

    def store_conversation(
        self,
        user_id: str,
        initial_messages: Optional[list[dict]] = None,
    ) -> ConversationCreateResponse:
        if initial_messages is None:
            initial_messages = []

        updated_at = datetime.utcnow()

        result = self._collection.insert_one(
            {
                "user_id": user_id,
                "updated_at": updated_at,
                "messages": initial_messages,
            }
        )

        return ConversationCreateResponse(
            id=str(result.inserted_id),
            updated_at=updated_at,
        )

    @handle_invalid_id
    def append_new_messages_to_conversation(
        self,
        conversation_id: str,
        new_messages: list[dict],
        user_id: str,
    ) -> None:
        self._collection.update_one(
            {"user_id": user_id, "_id": ObjectId(conversation_id)},
            {
                "$push": {"messages": {"$each": new_messages}},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

    def retrieve_all_conversations_metadata(
        self, user_id: str
    ) -> list[ConversationMetadataRetrieve]:
        result = self._collection.find({"user_id": user_id}, {"messages": False}).sort(
            [("updated_at", pymongo.DESCENDING), ("_id", pymongo.DESCENDING)]
        )

        return [
            ConversationMetadataRetrieve(
                id=str(conversation["_id"]),
                title=conversation.get("title", None),
                updated_at=conversation["updated_at"],
            )
            for conversation in result
        ]

    @handle_invalid_id
    def fetch_conversation(self, id: str, user_id: str) -> ConversationDialogueRetrieve:
        result = self._collection.find_one(
            {"user_id": user_id, "_id": ObjectId(id)},
            {
                "_id": False,
                "messages": True,
                "stream_state": True,
                "stream_partial_reply": True,
                "stream_updated_at": True,
                "stream_error": True,
            },
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dialogue with id={id} not found",
            )

        return ConversationDialogueRetrieve(
            messages=result["messages"],
            state=self._build_stream_state(result),
        )

    @handle_invalid_id
    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest, user_id: str
    ) -> None:
        result = self._collection.update_one(
            {"user_id": user_id, "_id": ObjectId(id)},
            {"$set": {"title": metadata.title}},
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with id={id} not found",
            )

    @handle_invalid_id
    def delete_conversation(self, id: str, user_id: str) -> None:
        result = self._collection.delete_one({"user_id": user_id, "_id": ObjectId(id)})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with id={id} not found",
            )

    def delete_user_data(self, user_id: str) -> None:
        self._collection.delete_many({"user_id": user_id})

    @handle_invalid_id
    def set_stream_state(
        self,
        conversation_id: str,
        user_id: str,
        status: StreamStatus,
        partial_reply: str | None = None,
        error: str | None = None,
    ) -> None:
        self._collection.update_one(
            {"user_id": user_id, "_id": ObjectId(conversation_id)},
            {
                "$set": {
                    "stream_state": status,
                    "stream_partial_reply": partial_reply or "",
                    "stream_updated_at": datetime.utcnow(),
                    "stream_error": error,
                }
            },
        )

    @handle_invalid_id
    def clear_stream_state(
        self,
        conversation_id: str,
        user_id: str,
    ) -> None:
        self._collection.update_one(
            {"user_id": user_id, "_id": ObjectId(conversation_id)},
            {
                "$set": {
                    "stream_state": "idle",
                    "stream_partial_reply": "",
                    "stream_updated_at": datetime.utcnow(),
                    "stream_error": None,
                }
            },
        )

    @handle_invalid_id
    def get_stream_state(
        self,
        conversation_id: str,
        user_id: str,
    ) -> ConversationStreamState:
        result = self._collection.find_one(
            {"user_id": user_id, "_id": ObjectId(conversation_id)},
            {
                "_id": False,
                "stream_state": True,
                "stream_partial_reply": True,
                "stream_updated_at": True,
                "stream_error": True,
            },
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dialogue with id={conversation_id} not found",
            )

        return self._build_stream_state(result)

    @staticmethod
    def _build_stream_state(conversation_doc: dict) -> ConversationStreamState:
        return ConversationStreamState(
            status=conversation_doc.get("stream_state", "idle"),
            partial_reply=conversation_doc.get("stream_partial_reply") or "",
            updated_at=conversation_doc.get("stream_updated_at"),
            error=conversation_doc.get("stream_error"),
        )
