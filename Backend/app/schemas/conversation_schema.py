from pydantic import BaseModel
from datetime import datetime


class UserChatbotInteraction(BaseModel):
    user_message: dict[str, str]
    assistant_response: dict[str, str]


class ConversationRetrieve(BaseModel):
    id: str
    title: str
    started_at: datetime


class ConversationCreate(BaseModel):
    title: str
