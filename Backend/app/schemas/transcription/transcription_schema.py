from pydantic import BaseModel, Field


class LanguageOption(BaseModel):
    """Language option with code and human-readable name"""

    code: str = Field(..., description="ISO 639-1 language code")
    name: str = Field(..., description="Human-readable language name")
