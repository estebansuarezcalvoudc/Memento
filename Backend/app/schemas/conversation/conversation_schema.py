from datetime import datetime

from pydantic import BaseModel, Field


class ConversationDialogueRetrieve(BaseModel):
    messages: list[dict]


class ConversationMetadataRetrieve(BaseModel):
    id: str
    title: str
    started_at: datetime


class SendMessageRequest(BaseModel):
    message: str
    current_datetime: datetime = Field(
        description="Current date and time of the user (with timezone offset). Used for resolving relative time references like 'today'.",
    )


ConversationCreateRequest = SendMessageRequest


ConversationCreateResponse = ConversationMetadataRetrieve


Messages = list[dict]


class ConversationUpdateRequest(BaseModel):
    title: str
