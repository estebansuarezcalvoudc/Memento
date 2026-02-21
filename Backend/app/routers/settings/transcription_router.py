from typing import Annotated

from fastapi import APIRouter, Depends

from ...dependencies.auth_dependencies import get_current_active_user
from ...dependencies.service_dependencies import get_transcription_service
from ...schemas.auth.auth_schema import User
from ...schemas.transcription.transcription_schema import LanguageOption
from ...services.transcription.interfaces.transcription_service import TranscriptionService

router = APIRouter(prefix="/transcription", tags=["Settings - Transcription"])


@router.get("/available-options")
def get_available_options(
    service: Annotated[TranscriptionService, Depends(get_transcription_service)],
):
    """
    Get available options for the active transcription service
    (e.g. model sizes, compute types).
    """
    return service.get_available_options()


@router.get("/languages", response_model=list[LanguageOption])
def get_supported_languages(
    service: Annotated[TranscriptionService, Depends(get_transcription_service)],
) -> list[LanguageOption]:
    """
    Get list of languages supported by the active transcription service,
    sorted alphabetically by name.
    """
    return service.get_supported_languages()


@router.get("/configuration")
def get_configuration(
    user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[TranscriptionService, Depends(get_transcription_service)],
):
    """
    Get the current user's transcription configuration.
    """
    return service.get_user_configuration(user.username)


@router.patch("/configuration")
def update_configuration(
    update: dict,
    user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[TranscriptionService, Depends(get_transcription_service)],
):
    """
    Partially update the current user's transcription configuration.
    Accepted fields depend on the active transcription provider.
    """
    return service.update_user_configuration(user.username, update)
