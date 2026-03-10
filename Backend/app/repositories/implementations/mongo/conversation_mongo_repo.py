from datetime import datetime
from typing import Optional

import pymongo
from bson import ObjectId
from fastapi import HTTPException, status

from ....core.settings import settings
from ....schemas.conversation.conversation_schema import (
    ConversationCreateResponse,
    ConversationDialogueRetrieve,
    ConversationMetadataRetrieve,
    ConversationUpdateRequest,
)
from ...interfaces.conversation_repo import (
    ConversationRepository as AbstractConversationRepository,
)
from .utils.handle_invalid_id import handle_invalid_id


class ConversationMongoRepository(AbstractConversationRepository):
    def __init__(self):
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["tfg_db"]
        self._collection = mydb["conversations"]
        self._collection.create_index("user_id", background=True)

    def store_conversation(
        self,
        conversation_title: str,
        user_id: str,
        initial_messages: Optional[list[dict]] = None,
    ) -> ConversationCreateResponse:
        if initial_messages is None:
            initial_messages = []

        started_at = datetime.today()

        result = self._collection.insert_one(
            {
                "user_id": user_id,
                "title": conversation_title,
                "started_at": started_at,
                "messages": initial_messages,
            }
        )

        return ConversationCreateResponse(
            id=str(result.inserted_id),
            title=conversation_title,
            started_at=started_at,
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
            {"$push": {"messages": {"$each": new_messages}}},
        )

    def retrieve_all_conversations_metadata(
        self, user_id: str
    ) -> list[ConversationMetadataRetrieve]:
        result = self._collection.find({"user_id": user_id}, {"messages": False})

        return [
            ConversationMetadataRetrieve(
                id=str(conversation["_id"]),
                title=conversation["title"],
                started_at=conversation["started_at"],
            )
            for conversation in result
        ]

    @handle_invalid_id
    def fetch_conversation(self, id: str, user_id: str) -> ConversationDialogueRetrieve:
        result = self._collection.find_one(
            {"user_id": user_id, "_id": ObjectId(id)},
            {"_id": False, "messages": True},
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dialogue with id={id} not found",
            )

        return ConversationDialogueRetrieve(messages=result["messages"])

    @handle_invalid_id
    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest, user_id: str
    ) -> None:
        result = self._collection.update_one(
            {"user_id": user_id, "_id": ObjectId(id)},
            {"$set": {"title": metadata.title}},
        )

        if result.modified_count == 0:
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
