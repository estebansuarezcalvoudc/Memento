from datetime import datetime

from pydantic import BaseModel, Field

from .language_models_schema import LanguageModelConfiguration


class ConversationDialogueRetrieve(BaseModel):
    messages: list[dict]


class ConversationMetadataRetrieve(BaseModel):
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


class ConversationUpdateRequest(BaseModel):
    title: str
