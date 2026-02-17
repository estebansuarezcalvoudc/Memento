from typing import Annotated

from fastapi import APIRouter, Depends

from ...dependencies.auth_dependencies import get_current_active_user
from ...repositories.settings.settings_repo import SettingsRepository
from ...schemas.auth_schema import User
from ...schemas.whisperx_schema import (
    WhisperXAvailableOptions,
    WhisperXConfiguration,
    WhisperXConfigurationUpdate,
)
from ...services.settings.whisperx_service import WhisperXService

router = APIRouter(
    prefix="/transcription/whisperx", tags=["Settings - Transcription - WhisperX"]
)


def get_whisperx_service() -> WhisperXService:
    """Dependency to get WhisperX service instance"""
    return WhisperXService(SettingsRepository())


@router.get("/available-options", response_model=WhisperXAvailableOptions)
def get_available_options(
    service: Annotated[WhisperXService, Depends(get_whisperx_service)]
) -> WhisperXAvailableOptions:
    """
    Get available WhisperX models and compute types

    Returns list of model sizes and compute types that can be selected
    """
    return service.get_available_options()


@router.get("/languages", response_model=list[str])
def get_supported_languages(
    service: Annotated[WhisperXService, Depends(get_whisperx_service)]
) -> list[str]:
    """
    Get list of supported languages for WhisperX transcription

    Returns ISO 639-1 language codes supported by WhisperX alignment models
    """
    return service.get_supported_languages()


@router.get("", response_model=WhisperXConfiguration)
def get_whisperx_configuration(
    user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[WhisperXService, Depends(get_whisperx_service)],
) -> WhisperXConfiguration:
    """
    Get current user's WhisperX transcription configuration

    Returns user's configured model_size and compute_type, or defaults if not set
    """
    return service.get_user_configuration(user.username)


@router.patch("", response_model=WhisperXConfiguration)
def update_whisperx_configuration(
    update: WhisperXConfigurationUpdate,
    user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[WhisperXService, Depends(get_whisperx_service)],
) -> WhisperXConfiguration:
    """
    Update user's WhisperX transcription configuration

    Allows partial updates - only provided fields will be updated
    """
    return service.update_user_configuration(user.username, update)
