from pydantic import BaseModel, Field

from ...core.providers_config import ProviderName


class ModelConfig(BaseModel):
    """Configuration for a specific model (chat, summary, or retrieval)"""

    provider: ProviderName
    model_name: str
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2000, gt=0)


class AvailableModel(BaseModel):
    """A model available from a provider"""

    id: str  # Model identifier (e.g., "gpt-4o", "llama3.1")
    provider: str  # "OpenAI" or "Ollama"


class PullModelRequest(BaseModel):
    provider: ProviderName
    model_name: str
