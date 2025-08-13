from enum import Enum
from pydantic import BaseModel, Field


class ProviderType(str, Enum):
    OPENAI = "openai"
    OLLAMA = "ollama"


class LanguageModelConfiguration(BaseModel):
    provider: ProviderType = Field(
        default=ProviderType.OPENAI,
        description="The provider to use for the language model",
    )
    model: str = Field(
        default="gpt-4o-mini",
        description="The specific model to use for generating responses",
    )
