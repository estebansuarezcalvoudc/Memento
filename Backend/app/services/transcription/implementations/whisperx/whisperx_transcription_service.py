import tempfile
from typing import get_args

import whisperx
import whisperx.diarize
from fastapi import HTTPException, status
from pydantic import ValidationError

from .....core.logging import log_execution_time, setup_logger
from .....core.settings import settings
from .....repositories.interfaces.settings_repo import SettingsRepository
from .....schemas.settings.whisperx_schema import (
    LANGUAGE_NAMES,
    ComputeType,
    Device,
    WhisperXAvailableOptions,
    WhisperXConfiguration,
    WhisperXConfigurationUpdate,
    WhisperXModel,
)
from .....schemas.transcription.transcription_schema import LanguageOption
from ....meeting.meeting_processing.gpu_utils import get_device, try_on_gpu
from ...interfaces.transcription_service import TranscriptionResult, TranscriptionService

_logger = setup_logger(__name__)


class WhisperXTranscriptionService(TranscriptionService):
    """WhisperX-based transcription service.

    Handles both transcription execution and user configuration management.
    """

    def __init__(self, settings_repo: SettingsRepository):
        self._settings_repo = settings_repo
        self._device = get_device()

    # --- TranscriptionService interface ---

    def transcribe(
        self, audio_bytes: bytes, language: str | None, username: str
    ) -> TranscriptionResult:
        config = self._get_user_config(username)
        audio = self._load_audio(audio_bytes)
        device = config.device

        transcription_result = self._transcribe_audio(
            audio, language, device, config.compute_type, config.model_size
        )

        detected_language = (
            language if language else transcription_result.get("language")
        )

        aligned = self._align_audio(
            transcription_result, audio, device, detected_language
        )
        segments = self._diarize_audio(audio, device)
        diarized = whisperx.assign_word_speakers(segments, aligned)
        text = self._build_dialogue(diarized)

        return TranscriptionResult(text=text, language=detected_language)

    def get_supported_languages(self) -> list[LanguageOption]:
        languages = [
            LanguageOption(code=code, name=name)
            for code, name in LANGUAGE_NAMES.items()
        ]
        return sorted(languages, key=lambda x: x.name)

    # --- WhisperX-specific configuration methods ---

    def get_available_options(self) -> WhisperXAvailableOptions:
        models = list(get_args(WhisperXModel))
        compute_types = list(get_args(ComputeType))
        devices = list(get_args(Device))
        return WhisperXAvailableOptions(models=models, compute_types=compute_types, devices=devices)

    def get_user_configuration(self, username: str) -> WhisperXConfiguration:
        return self._get_user_config(username)

    def update_user_configuration(
        self, username: str, data: dict
    ) -> WhisperXConfiguration:
        try:
            update = WhisperXConfigurationUpdate(**data)
        except ValidationError as e:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=e.errors())
        update_data = update.model_dump(exclude_none=True)
        if update_data:
            self._settings_repo.update_transcription_settings(username, update_data)
        return self.get_user_configuration(username)

    # --- Private helpers ---

    def _get_user_config(self, username: str) -> WhisperXConfiguration:
        user_settings = self._settings_repo.get_transcription_settings(username)
        if not user_settings:
            return WhisperXConfiguration()
        return WhisperXConfiguration(**user_settings)

    def _load_audio(self, audio_bytes: bytes):
        with tempfile.NamedTemporaryFile(suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_file.flush()
            return whisperx.load_audio(temp_file.name)

    @log_execution_time(_logger)
    @try_on_gpu
    def _transcribe_audio(
        self, audio, language=None, device="cpu", compute_type="int8", model_size="tiny"
    ):
        if language:
            model = whisperx.load_model(
                model_size, device, language=language, compute_type=compute_type
            )
        else:
            model = whisperx.load_model(model_size, device, compute_type=compute_type)
        return model.transcribe(audio, batch_size=10)

    @log_execution_time(_logger)
    @try_on_gpu
    def _align_audio(self, transcription_result, audio, device="cpu", language=None):
        if language:
            model_a, metadata = whisperx.load_align_model(
                language_code=language, device=device
            )
        else:
            model_a, metadata = whisperx.load_align_model(device=device)
        return whisperx.align(
            transcription_result["segments"],
            model_a,
            metadata,
            audio,
            device,
            return_char_alignments=False,
        )

    @log_execution_time(_logger)
    @try_on_gpu
    def _diarize_audio(self, audio, device="cpu", min_speakers=None, max_speakers=None):
        diarize_model = whisperx.diarize.DiarizationPipeline(
            use_auth_token=settings.hf_token, device=device
        )
        return diarize_model(
            audio,
            min_speakers=min_speakers,
            max_speakers=max_speakers,
        )

    @log_execution_time(_logger)
    def _build_dialogue(self, diarized_conversation) -> str:
        segments = diarized_conversation["segments"]
        current_speaker = None
        conversation = ""

        for segment in segments:
            speaker = segment.get("speaker", "Unknown")
            text = segment.get("text", "")

            if speaker == current_speaker:
                conversation += f" {text.strip()}"
                continue

            if conversation:
                conversation += "</p>"

            conversation += f"<p><strong>{speaker}:</strong> {text.strip()}"
            current_speaker = speaker

        if conversation:
            conversation += "</p>"

        return conversation
