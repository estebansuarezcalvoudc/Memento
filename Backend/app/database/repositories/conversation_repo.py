from datetime import datetime

import pymongo
from bson import ObjectId

from ...core.settings import settings
from ...schemas.conversation_schema import (
    ConversationCreate,
    UserChatbotInteraction,
    ConversationRetrieve,
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
