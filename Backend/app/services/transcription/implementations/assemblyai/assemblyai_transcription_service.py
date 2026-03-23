from io import BytesIO

import assemblyai as aai
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.core.logging import setup_logger
from app.repositories.interfaces.settings_repo import SettingsRepository
from app.schemas.transcription.transcription_schema import LanguageOption
from app.services.transcription.interfaces.transcription_service import (
    TranscriptionResult,
    TranscriptionService,
)


class AssemblyaiTranscriptionService(TranscriptionService):
    def __init__(self, settings_repo: SettingsRepository):
        self._settings_repo = settings_repo
        self._logger = setup_logger(__name__)

    def transcribe(
        self, audio_bytes: bytes, language: str | None, user_id: str
    ) -> TranscriptionResult:
        aai.settings.api_key = "9bcb5c8f8e6a4757b23cfe64636a4c9c"

        config = aai.TranscriptionConfig(
            speech_models=["universal-3-pro", "universal-2"],
            language_detection=True,
            speaker_labels=True,
            language_code=language,
        )

        transcript = aai.Transcriber(config=config).transcribe(BytesIO(audio_bytes))

        if transcript.status == "error":
            self._logger.error(f"Transcription failed: {transcript.error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error transcribing conversation",
            )

        text = ""
        for utt in transcript.utterances or []:
            text += f"<p><strong>Speaker {utt.speaker}:</strong> {utt.text}</p>"

        return TranscriptionResult(text=text, language=str(transcript.language_code))

    def get_supported_languages(self) -> list[LanguageOption]:
        return super().get_supported_languages()

    def get_available_options(self) -> BaseModel:
        return super().get_available_options()

    def get_user_configuration(self, user_id: str) -> BaseModel:
        return super().get_user_configuration(user_id)

    def update_user_configuration(self, user_id: str, data: dict) -> BaseModel:
        return super().update_user_configuration(user_id, data)
