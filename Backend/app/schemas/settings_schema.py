from typing import Optional

from pydantic import BaseModel, Field


class Provider(BaseModel):
    """Provider information with status"""

    name: str = Field(..., description="Provider name (OpenAI, Ollama)")
    requires_api_key: bool = Field(
        ..., description="Whether this provider requires an API key"
    )
    active: bool = Field(
        ..., description="Whether user has activated this provider"
    )
    has_api_key: Optional[bool] = Field(
        None, description="Whether an API key is stored (null if not required)"
    )

    @property
    def enabled(self) -> bool:
        """Provider is enabled if it has API key (when required) or doesn't need one"""
        if not self.requires_api_key:
            return True
        return self.has_api_key or False


class ProviderAPIKeyRequest(BaseModel):
    """Request to add/update provider API key"""

    api_key: str = Field(..., min_length=1, description="API key for the provider")


class ProviderStatusRequest(BaseModel):
    """Request to update provider active status"""

    active: bool = Field(..., description="Whether to activate or deactivate provider")


class ProvidersListResponse(BaseModel):
    """Response with list of all providers"""

    providers: list[Provider]


class ProviderSettings(BaseModel):
    """Internal model for provider settings stored in database"""

    api_key_encrypted: Optional[str] = None
    active: bool = True
    base_url: Optional[str] = None
