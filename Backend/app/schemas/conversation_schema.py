from datetime import datetime

from pydantic import BaseModel, Field

from .language_models_schema import LanguageModelConfiguration


class DialogueRetrieve(BaseModel):
    messages: list[dict[str, str]]


class ConversationRetrieve(BaseModel):
    id: str
    title: str
    started_at: datetime


class SendMessageRequest(BaseModel):
    message: str
    language_model_configuration: LanguageModelConfiguration = Field(
        default_factory=LanguageModelConfiguration,
        description="Configuration for the language model and provider",
    )


ConversationCreateRequest = SendMessageRequest


class ConversationCreateResponse(BaseModel):
    id: str
    assistant_response: str


class ConversationUpdateRequest(BaseModel):
    title: str
