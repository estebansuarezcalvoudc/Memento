from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserChatbotInteraction(BaseModel):
    user_message: dict[str, str]
    assistant_response: dict[str, str]


class ConversationRetrieve(BaseModel):
    id: str
    title: str
    started_at: datetime


class ConversationCreate(BaseModel):
    title: str


class DialogueRetrieve(BaseModel):
    messages: list[dict[str, str]]


class ConversationUpdate(BaseModel):
    title: str
