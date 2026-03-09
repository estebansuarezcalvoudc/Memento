from typing import Optional

from pydantic import BaseModel, Field

from app.core.providers_config import ProviderName


class Provider(BaseModel):
    """Provider information with status"""

    name: ProviderName = Field(..., description="Provider name (OpenAI, Ollama)")
    requires_api_key: bool = Field(
        ..., description="Whether this provider requires an API key"
    )
    has_api_key: Optional[bool] = Field(
        None, description="Whether an API key is stored (null if not required)"
    )


class ProviderAPIKeyRequest(BaseModel):
    """Request to add/update provider API key"""

    api_key: str = Field(..., min_length=1, description="API key for the provider")


class ProviderSettings(BaseModel):
    """Internal model for provider settings stored in database"""

    api_key_encrypted: Optional[str] = None
    base_url: Optional[str] = None
    requires_api_key: bool = True
