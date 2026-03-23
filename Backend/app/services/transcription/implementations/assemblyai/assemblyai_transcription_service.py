from io import BytesIO

import assemblyai as aai
from fastapi import HTTPException, status
from pydantic import ValidationError

from .....core.encryption import decrypt_api_key
from .....core.logging import setup_logger
from .....repositories.interfaces.settings_repo import SettingsRepository
from .....schemas.settings.assemblyai_schema import (
    LANGUAGE_NAMES,
    AssemblyAIAvailableOptions,
    AssemblyAIConfiguration,
    AssemblyAIConfigurationUpdate,
)
from .....schemas.transcription.transcription_schema import LanguageOption
from ...interfaces.transcription_service import (
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
        api_key = self._get_user_api_key(user_id)
        client = aai.client.Client(settings=aai.types.Settings(api_key=api_key))
        transcriber = aai.Transcriber(client=client)
        user_config = self._get_user_config(user_id)

        config_kwargs: dict = {
            "speaker_labels": user_config.speaker_labels,
            "speech_model": aai.SpeechModel(user_config.speech_model),
        }
        if language:
            config_kwargs["language_code"] = language
            config_kwargs["language_detection"] = False
        else:
            config_kwargs["language_detection"] = True

        config = aai.TranscriptionConfig(**config_kwargs)

        transcript = transcriber.transcribe(BytesIO(audio_bytes), config=config)

        if transcript.status == aai.TranscriptStatus.error:
            self._logger.error(f"Transcription failed: {transcript.error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error transcribing conversation",
            )

        if transcript.utterances is None:
            text = transcript.text or ""
        else:
            text = ""
            for utt in transcript.utterances or []:
                text += f"<p><strong>Speaker {utt.speaker}:</strong> {utt.text}</p>"

        return TranscriptionResult(text=text, language=str(transcript.language_code))

    def _get_user_api_key(self, user_id: str) -> str:
        encrypted_api_key = (
            self._settings_repo.get_transcription_provider_api_key_encrypted(
                user_id, "aai"
            )
        )
        if not encrypted_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="AssemblyAI requires API key configuration",
            )
        return decrypt_api_key(encrypted_api_key)

    def _get_user_config(self, user_id: str) -> AssemblyAIConfiguration:
        user_settings = self._settings_repo.get_transcription_provider_settings(
            user_id, "aai"
        )
        if not user_settings:
            return AssemblyAIConfiguration()

        allowed_keys = set(AssemblyAIConfiguration.model_fields.keys())
        filtered = {k: v for k, v in user_settings.items() if k in allowed_keys}
        if "speech_model" in filtered:
            supported_models = {model.value for model in aai.SpeechModel}
            if filtered["speech_model"] not in supported_models:
                filtered["speech_model"] = AssemblyAIConfiguration().speech_model
        return AssemblyAIConfiguration(**filtered)

    def get_supported_languages(self) -> list[LanguageOption]:
        languages = [
            LanguageOption(code=code, name=LANGUAGE_NAMES.get(code, code.upper()))
            for code in (language.value for language in aai.types.LanguageCode)
        ]
        return sorted(languages, key=lambda x: x.name)

    def get_available_options(self) -> AssemblyAIAvailableOptions:
        speech_models = [model.value for model in aai.SpeechModel]
        return AssemblyAIAvailableOptions(speech_models=speech_models)

    def get_user_configuration(self, user_id: str) -> AssemblyAIConfiguration:
        return self._get_user_config(user_id)

    def update_user_configuration(
        self, user_id: str, data: dict
    ) -> AssemblyAIConfiguration:
        try:
            update = AssemblyAIConfigurationUpdate(**data)
        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=e.errors()
            )

        update_data = update.model_dump(exclude_none=True)
        if update_data:
            self._settings_repo.update_transcription_provider_settings(
                user_id, "aai", update_data
            )

        return self.get_user_configuration(user_id)

    def validate_api_key(self, api_key: str) -> None:
        try:
            client = aai.client.Client(
                settings=aai.types.Settings(api_key=api_key, http_timeout=15.0)
            )
            aai.Transcriber(client=client).list_transcripts(
                params=aai.types.ListTranscriptParameters(limit=1)
            )
        except aai.AssemblyAIError as e:
            if e.status_code in {
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            }:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid API key for aai",
                ) from e
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not validate API key right now. Please try again.",
            ) from e
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not validate API key right now. Please try again.",
            ) from e
