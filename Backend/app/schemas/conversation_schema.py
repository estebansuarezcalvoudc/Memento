from datetime import datetime

from pydantic import BaseModel


class DialogueRetrieve(BaseModel):
    messages: list[dict[str, str]]


class ConversationRetrieve(BaseModel):
    id: str
    title: str
    started_at: datetime


class ConversationCreateRequest(BaseModel):
    message: str


class ConversationCreateResponse(BaseModel):
    id: str
    assistant_response: str


class ConversationUpdate(BaseModel):
    title: str
