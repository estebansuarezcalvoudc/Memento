from datetime import datetime

from pydantic import BaseModel, Field


class DialogueRetrieve(BaseModel):
    messages: list[dict[str, str]]


class ConversationRetrieve(BaseModel):
    id: str
    title: str
    started_at: datetime


class SendMessageRequest(BaseModel):
    message: str
    language_model: str = Field(
        default="llama3.2",
        description="Specifies which language model generates the assistant's response",
    )


ConversationCreateRequest = SendMessageRequest


class ConversationCreateResponse(BaseModel):
    id: str
    assistant_response: str


class ConversationUpdateRequest(BaseModel):
    title: str
