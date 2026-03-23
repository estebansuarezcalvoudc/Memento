from ...repositories.interfaces.settings_repo import SettingsRepository
from .implementations.assemblyai.assemblyai_transcription_service import (
    AssemblyaiTranscriptionService,
)
from .implementations.whisperx.whisperx_transcription_service import (
    WhisperXTranscriptionService,
)
from .interfaces.transcription_service import TranscriptionService


def create_transcription_service(
    provider_name: str, settings_repo: SettingsRepository
) -> TranscriptionService:
    match provider_name:
        case "whisperx":
            return WhisperXTranscriptionService(settings_repo)
        case "aai":
            return AssemblyaiTranscriptionService(settings_repo)
        case _:
            raise ValueError(f"Unsupported transcription provider: {provider_name}")
