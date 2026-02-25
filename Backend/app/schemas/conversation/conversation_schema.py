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
    current_datetime: datetime = Field(
        description="Current date and time of the user (with timezone offset). Used for resolving relative time references like 'today'.",
    )


ConversationCreateRequest = SendMessageRequest


ConversationCreateResponse = ConversationMetadataRetrieve


Messages = list[dict]


class ConversationUpdateRequest(BaseModel):
    title: str
