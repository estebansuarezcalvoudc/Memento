from typing import Annotated

from fastapi import APIRouter, Depends, status

from ...dependencies.auth_dependencies import get_current_active_user
from ...dependencies.service_dependencies import get_transcription_providers_service
from ...schemas.auth.auth_schema import User
from ...schemas.settings.transcription_provider_schema import (
    ActiveTranscriptionProviderUpdate,
    TranscriptionProvider,
    TranscriptionProviderAPIKeyRequest,
)
from ...schemas.transcription.transcription_schema import LanguageOption
from ...services.settings.transcription_providers_service import (
    TranscriptionProvidersService,
)

router = APIRouter(prefix="/transcription", tags=["Settings - Transcription"])


@router.get("/providers", response_model=list[TranscriptionProvider])
def get_providers(
    user: Annotated[User, Depends(get_current_active_user)],
    providers_service: Annotated[
        TranscriptionProvidersService, Depends(get_transcription_providers_service)
    ],
) -> list[TranscriptionProvider]:
    return providers_service.get_providers(user.id)


@router.post(
    "/providers/{provider_name}/api-key", status_code=status.HTTP_204_NO_CONTENT
)
def add_provider_api_key(
    provider_name: str,
    request: TranscriptionProviderAPIKeyRequest,
    user: Annotated[User, Depends(get_current_active_user)],
    providers_service: Annotated[
        TranscriptionProvidersService, Depends(get_transcription_providers_service)
    ],
) -> None:
    providers_service.add_provider_api_key(user.id, provider_name, request.api_key)


@router.delete(
    "/providers/{provider_name}/api-key", status_code=status.HTTP_204_NO_CONTENT
)
def delete_provider_api_key(
    provider_name: str,
    user: Annotated[User, Depends(get_current_active_user)],
    providers_service: Annotated[
        TranscriptionProvidersService, Depends(get_transcription_providers_service)
    ],
) -> None:
    providers_service.delete_provider_api_key(user.id, provider_name)


@router.patch("/active-provider", status_code=status.HTTP_204_NO_CONTENT)
def set_active_provider(
    update: ActiveTranscriptionProviderUpdate,
    user: Annotated[User, Depends(get_current_active_user)],
    providers_service: Annotated[
        TranscriptionProvidersService, Depends(get_transcription_providers_service)
    ],
) -> None:
    providers_service.set_active_provider(user.id, update.provider)


@router.get("/available-options")
def get_available_options(
    user: Annotated[User, Depends(get_current_active_user)],
    providers_service: Annotated[
        TranscriptionProvidersService, Depends(get_transcription_providers_service)
    ],
):
    """
    Get available options for the active transcription service
    (e.g. model sizes, compute types).
    """
    service = providers_service.get_transcription_service_for_user(user.id)
    return service.get_available_options()


@router.get("/languages", response_model=list[LanguageOption])
def get_supported_languages(
    user: Annotated[User, Depends(get_current_active_user)],
    providers_service: Annotated[
        TranscriptionProvidersService, Depends(get_transcription_providers_service)
    ],
) -> list[LanguageOption]:
    """
    Get list of languages supported by the active transcription service,
    sorted alphabetically by name.
    """
    service = providers_service.get_transcription_service_for_user(user.id)
    return service.get_supported_languages()


@router.get("/configuration")
def get_configuration(
    user: Annotated[User, Depends(get_current_active_user)],
    providers_service: Annotated[
        TranscriptionProvidersService, Depends(get_transcription_providers_service)
    ],
):
    """
    Get the current user's transcription configuration.
    """
    service = providers_service.get_transcription_service_for_user(user.id)
    return service.get_user_configuration(user.id)


@router.patch("/configuration")
def update_configuration(
    update: dict,
    user: Annotated[User, Depends(get_current_active_user)],
    providers_service: Annotated[
        TranscriptionProvidersService, Depends(get_transcription_providers_service)
    ],
):
    """
    Partially update the current user's transcription configuration.
    Accepted fields depend on the active transcription provider.
    """
    service = providers_service.get_transcription_service_for_user(user.id)
    return service.update_user_configuration(user.id, update)
