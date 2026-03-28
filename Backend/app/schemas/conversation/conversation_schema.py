from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field

StreamStatus = Literal["idle", "retrieving", "thinking", "streaming"]


class ConversationStreamState(BaseModel):
    status: StreamStatus = "idle"
    partial_reply: str = ""
    updated_at: datetime | None = None
    error: str | None = None


class ConversationDialogueRetrieve(BaseModel):
    messages: list[dict]
    state: ConversationStreamState = Field(default_factory=ConversationStreamState)


class ConversationMetadataRetrieve(BaseModel):
    id: str
    title: str | None
    updated_at: datetime


class SendMessageRequest(BaseModel):
    message: str
    current_datetime: AwareDatetime = Field(
        description="Current date and time of the user (with timezone offset). Used for resolving relative time references like 'today'.",
    )


ConversationCreateRequest = SendMessageRequest


class ConversationCreateResponse(BaseModel):
    id: str
    updated_at: datetime


class ConversationDialogueResponse(BaseModel):
    messages: list[dict]
    state: ConversationStreamState


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


class RetrievingEvent(BaseModel):
    type: Literal["retrieving"] = "retrieving"


class TokenEvent(BaseModel):
    type: Literal["token"] = "token"
    content: str


class ThinkingStartEvent(BaseModel):
    type: Literal["thinking_start"] = "thinking_start"


class ThinkingEndEvent(BaseModel):
    type: Literal["thinking_end"] = "thinking_end"


class DoneEvent(BaseModel):
    type: Literal["done"] = "done"


class TitleEvent(BaseModel):
    type: Literal["title"] = "title"
    title: str


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    content: str


ChatEvent = (
    ConversationCreatedEvent
    | RetrievingEvent
    | ThinkingStartEvent
    | ThinkingEndEvent
    | TokenEvent
    | DoneEvent
    | TitleEvent
    | ErrorEvent
)
