from datetime import datetime
from functools import wraps

import pymongo
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from ...core.settings import settings
from ...schemas.conversation_schema import (
    ConversationRetrieve,
    ConversationUpdateRequest,
    DialogueRetrieve,
)
from ..models.conversation_model import ConversationModel


def _handle_invalid_id(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except InvalidId as e:
            id_value = kwargs.get("id") or "unknown"
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"The id={id_value} is not a valid id",
            ) from e

    return wrapper


class ConversationRepository:
    def __init__(self):
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["chat_db"]
        self._collection = mydb["conversations"]

    def store_conversation(self, conversation_title: str) -> str:
        conversation = ConversationModel(
            title=conversation_title, started_at=datetime.today()
        )

        result = self._collection.insert_one(
            conversation.model_dump(by_alias=True, exclude={"id"})
        )
        return str(result.inserted_id)

    @_handle_invalid_id
    def add_user_chatbot_interaction(
        self, id: str, user_message: dict[str, str], assistant_response: dict[str, str]
    ) -> None:
        self._collection.update_one(
            {"_id": ObjectId(id)},
            {"$push": {"messages": {"$each": [user_message, assistant_response]}}},
        )

    def retrieve_all_conversations_metadata(self) -> list[ConversationRetrieve]:
        result = self._collection.find({}, {"messages": False})

        return [
            ConversationRetrieve(
                id=str(conversation["_id"]),
                title=conversation["title"],
                started_at=conversation["started_at"],
            )
            for conversation in result
        ]

    @_handle_invalid_id
    def retrieve_dialogue(self, id: str) -> DialogueRetrieve:
        result = self._collection.find_one(
            {"_id": ObjectId(id)}, {"_id": False, "messages": True}
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dialogue with id={id} not found",
            )

        return DialogueRetrieve(messages=result["messages"])

    @_handle_invalid_id
    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest
    ) -> None:
        result = self._collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"title": metadata.title}},
        )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with id={id} not found",
            )

    @_handle_invalid_id
    def delete_conversation(self, id: str) -> None:
        result = self._collection.delete_one({"_id": ObjectId(id)})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with id={id} not found",
            )
