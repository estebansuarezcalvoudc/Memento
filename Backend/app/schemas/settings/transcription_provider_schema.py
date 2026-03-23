from typing import Literal, Optional

from pydantic import BaseModel, Field

TranscriptionProviderName = Literal["whisperx", "aai"]


class TranscriptionProvider(BaseModel):
    name: TranscriptionProviderName
    requires_api_key: bool = Field(
        ..., description="Whether this transcription provider requires an API key"
    )
    has_api_key: Optional[bool] = Field(
        None,
        description="Whether an API key is stored for this provider (null if not required)",
    )
    is_active: bool = Field(
        ..., description="Whether this provider is currently active"
    )


class TranscriptionProviderAPIKeyRequest(BaseModel):
    api_key: str = Field(
        ..., min_length=1, description="API key for the transcription provider"
    )


class ActiveTranscriptionProviderResponse(BaseModel):
    provider: TranscriptionProviderName


class ActiveTranscriptionProviderUpdate(BaseModel):
    provider: TranscriptionProviderName
