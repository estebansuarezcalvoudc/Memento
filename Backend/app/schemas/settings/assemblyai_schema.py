from typing import Optional

from pydantic import BaseModel, Field

LANGUAGE_NAMES = {
    "de": "German",
    "de_ch": "German (Switzerland)",
    "en": "English",
    "en_au": "English (Australia)",
    "en_uk": "English (United Kingdom)",
    "en_us": "English (United States)",
    "es": "Spanish",
    "fi": "Finnish",
    "fr": "French",
    "hi": "Hindi",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "nl": "Dutch",
    "pl": "Polish",
    "pt": "Portuguese",
    "ru": "Russian",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "vi": "Vietnamese",
    "zh": "Chinese",
}


class AssemblyAIConfiguration(BaseModel):
    speech_model: str = Field(
        default="universal", description="AssemblyAI speech model to use"
    )
    speaker_labels: bool = Field(
        default=True, description="Enable speaker diarization labels"
    )


class AssemblyAIConfigurationUpdate(BaseModel):
    speech_model: Optional[str] = Field(None, description="AssemblyAI speech model")
    speaker_labels: Optional[bool] = Field(
        None, description="Enable speaker diarization labels"
    )


class AssemblyAIAvailableOptions(BaseModel):
    speech_models: list[str] = Field(..., description="List of available speech models")
    supports_language_detection: bool = Field(
        default=True, description="Whether automatic language detection is supported"
    )
