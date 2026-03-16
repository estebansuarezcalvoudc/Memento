from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field


class ConversationDialogueRetrieve(BaseModel):
    messages: list[dict]


class ConversationMetadataRetrieve(BaseModel):
    id: str
    title: str
    started_at: datetime


class SendMessageRequest(BaseModel):
    message: str
    current_datetime: AwareDatetime = Field(
        description="Current date and time of the user (with timezone offset). Used for resolving relative time references like 'today'.",
    )


ConversationCreateRequest = SendMessageRequest


ConversationCreateResponse = ConversationMetadataRetrieve


Messages = list[dict]


class ConversationUpdateRequest(BaseModel):
    title: str


# --- WebSocket chat ---


class ChatRequest(BaseModel):
    """Payload sent by the client over the WebSocket."""

    conversation_id: str | None = Field(
        default=None,
        description="ID of an existing conversation. Pass null to create a new one.",
    )
    message: str
    current_datetime: AwareDatetime = Field(
        description="Current date and time of the user. Used for resolving relative time references.",
    )


class ConversationCreatedEvent(BaseModel):
    type: Literal["conversation_created"] = "conversation_created"
    conversation_id: str
    title: str


class RetrievingEvent(BaseModel):
    type: Literal["retrieving"] = "retrieving"


class TokenEvent(BaseModel):
    type: Literal["token"] = "token"
    content: str


class DoneEvent(BaseModel):
    type: Literal["done"] = "done"


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    content: str


ChatEvent = (
    ConversationCreatedEvent | RetrievingEvent | TokenEvent | DoneEvent | ErrorEvent
)
