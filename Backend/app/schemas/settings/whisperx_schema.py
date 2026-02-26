from typing import Literal, Optional

from pydantic import BaseModel, Field

from ..transcription.transcription_schema import LanguageOption  # noqa: F401

# Language code to human-readable name mapping
# Languages supported by WhisperX alignment models
# Source: https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py
LANGUAGE_NAMES = {
    "ar": "Arabic",
    "ca": "Catalan",
    "cs": "Czech",
    "da": "Danish",
    "de": "German",
    "el": "Greek",
    "en": "English",
    "es": "Spanish",
    "eu": "Basque",
    "fa": "Persian",
    "fi": "Finnish",
    "fr": "French",
    "gl": "Galician",
    "he": "Hebrew",
    "hi": "Hindi",
    "hr": "Croatian",
    "hu": "Hungarian",
    "it": "Italian",
    "ja": "Japanese",
    "ka": "Georgian",
    "ko": "Korean",
    "lv": "Latvian",
    "ml": "Malayalam",
    "nl": "Dutch",
    "nn": "Norwegian Nynorsk",
    "no": "Norwegian",
    "pl": "Polish",
    "pt": "Portuguese",
    "ro": "Romanian",
    "ru": "Russian",
    "sk": "Slovak",
    "sl": "Slovenian",
    "sv": "Swedish",
    "te": "Telugu",
    "tl": "Filipino",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "vi": "Vietnamese",
    "zh": "Chinese",
}

# Helper to get just the language codes
SUPPORTED_LANGUAGES = list(LANGUAGE_NAMES.keys())


# WhisperX available models
WhisperXModel = Literal[
    "tiny", "base", "small", "medium", "large", "large-v2", "large-v3"
]

# WhisperX compute types
ComputeType = Literal["int8", "float16", "float32"]

# Device selection
Device = Literal["cuda", "cpu"]


class WhisperXConfiguration(BaseModel):
    """User's WhisperX configuration for transcription"""

    model_size: WhisperXModel = Field(
        default="tiny", description="WhisperX model size to use for transcription"
    )
    compute_type: ComputeType = Field(
        default="int8",
        description="Compute precision type (int8 for CPU, float16 for GPU)",
    )
    device: Device = Field(
        default="cuda",
        description="Device to use for transcription. 'cuda' falls back to CPU automatically if GPU is unavailable.",
    )


class WhisperXConfigurationUpdate(BaseModel):
    """Request to update WhisperX configuration"""

    model_size: Optional[WhisperXModel] = Field(
        None, description="WhisperX model size to use"
    )
    compute_type: Optional[ComputeType] = Field(
        None, description="Compute precision type"
    )
    device: Optional[Device] = Field(
        None, description="Device to use for transcription"
    )


class WhisperXAvailableOptions(BaseModel):
    """Available WhisperX models and compute types"""

    models: list[str] = Field(..., description="List of available WhisperX model sizes")
    compute_types: list[str] = Field(..., description="List of available compute types")
    devices: list[str] = Field(..., description="List of available device options")
