from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ProviderType(str, Enum):
    OPENAI = "openai"
    OLLAMA = "ollama"


class ModelConfiguration(BaseModel):
    provider: ProviderType = Field(
        default=ProviderType.OPENAI,
        description="The provider to use for the language model",
    )
    model: str = Field(
        default="gpt-4o-mini",
        description="The specific model to use for generating responses",
    )


class DialogueRetrieve(BaseModel):
    messages: list[dict[str, str]]


class ConversationRetrieve(BaseModel):
    id: str
    title: str
    started_at: datetime


class SendMessageRequest(BaseModel):
    message: str
    model_configuration: ModelConfiguration = Field(
        default_factory=ModelConfiguration,
        description="Configuration for the language model and provider",
    )


ConversationCreateRequest = SendMessageRequest


class ConversationCreateResponse(BaseModel):
    id: str
    assistant_response: str


class ConversationUpdateRequest(BaseModel):
    title: str
