from datetime import datetime

import pymongo
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from ...core.settings import settings
from ...schemas.conversation_schema import (
    ConversationCreate,
    ConversationRetrieve,
    ConversationUpdate,
    DialogueRetrieve,
    UserChatbotInteraction,
)
from ..models.conversation_model import ConversationModel


class ConversationRepository:
    def __init__(self):
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["chat_db"]
        self._collection = mydb["conversations"]

    def create_conversation(self, data: ConversationCreate) -> str:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["chat_db"]
        self._collection = mydb["conversations"]
        conversation = ConversationModel(title=data.title, started_at=datetime.today())

        result = self._collection.insert_one(
            conversation.model_dump(by_alias=True, exclude={"id"})
        )
        return result.inserted_id

    def add_user_chatbot_interaction(
        self, conversation_id: str, interaction: UserChatbotInteraction
    ) -> None:
        try:
            self._collection.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$push": {
                        "messages": {
                            "$each": [
                                interaction.user_message,
                                interaction.assistant_response,
                            ]
                        }
                    }
                },
            )
        except InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The id={id} is not valid",
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

    def retrieve_dialogue(self, id: str) -> DialogueRetrieve:
        try:
            result = self._collection.find_one(
                {"_id": ObjectId(id)}, {"_id": False, "messages": True}
            )
        except InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The id={id} is not valid",
            )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dialogue with id={id} not found",
            )

        return DialogueRetrieve(messages=result["messages"])

    def delete_conversation(self, id: str) -> None:
        try:
            result = self._collection.delete_one({"_id": ObjectId(id)})
        except InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The id={id} is not valid",
            )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with id={id} not found",
            )

    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdate
    ) -> None:
        try:
            result = self._collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"title": metadata.title}},
            )
        except InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The id={id} is not valid",
            )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with id={id} not found",
            )
