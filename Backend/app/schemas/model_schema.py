from pydantic import BaseModel, Field

from ..core.openai_factory import ProviderName


class ModelConfig(BaseModel):
    """Configuration for a specific model (chat or summary)"""

    provider: ProviderName
    model_name: str
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2000, gt=0)


class ConfiguredModelsResponse(BaseModel):
    """Response with user's configured models"""

    chat_model: ModelConfig | None = None
    summary_model: ModelConfig | None = None


class ConfiguredModelsRequest(BaseModel):
    """Request to update configured models (partial update allowed)"""

    chat_model: ModelConfig | None = None
    summary_model: ModelConfig | None = None


class AvailableModel(BaseModel):
    """A model available from a provider"""

    id: str  # Model identifier (e.g., "gpt-4o", "llama3.1")
    provider: str  # "OpenAI" or "Ollama"


class ModelSettings(BaseModel):
    """Model settings stored in MongoDB"""

    chat_model: ModelConfig | None = None
    summary_model: ModelConfig | None = None
