from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from ...core.logging import setup_logger
from ...dependencies.auth_dependencies import get_current_active_user
from ...schemas.auth.auth_schema import User
from ...schemas.settings.provider_schema import (
    ProviderAPIKeyRequest,
    ProvidersListResponse,
    ProviderStatusRequest,
)
from ...services.settings.providers_service import ProvidersService

_logger = setup_logger(__name__)
router = APIRouter(prefix="/providers", tags=["Settings - Providers"])


@router.get("", response_model=ProvidersListResponse)
async def get_providers(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ProvidersListResponse:
    """
    Get all available providers with their status for the current user

    Returns:
        ProvidersListResponse: List of providers with their configuration status
    """
    try:
        service = ProvidersService()
        providers = service.get_providers(current_user.username)
        return ProvidersListResponse(providers=providers)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error getting providers: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting providers",
        )


@router.post(
    "/{provider_name}/api-key",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def add_provider_api_key(
    provider_name: str,
    request: ProviderAPIKeyRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> None:
    """
    Add or update API key for a provider

    Args:
        provider_name: Name of the provider (e.g., "OpenAI")
        request: Request body containing the API key

    Raises:
        400: If provider is invalid or doesn't require API key
        401: If API key is invalid (validation failed)
    """
    try:
        service = ProvidersService()
        service.add_provider_api_key(
            current_user.username, provider_name, request.api_key
        )
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error adding provider API key: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while adding API key",
        )


@router.delete(
    "/{provider_name}/api-key",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_provider_api_key(
    provider_name: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> None:
    """
    Delete API key for a provider

    Args:
        provider_name: Name of the provider (e.g., "OpenAI")

    Raises:
        400: If provider is invalid
    """
    try:
        service = ProvidersService()
        service.delete_provider_api_key(current_user.username, provider_name)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error deleting provider API key: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting API key",
        )


@router.patch(
    "/{provider_name}/status",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def update_provider_status(
    provider_name: str,
    request: ProviderStatusRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> None:
    """
    Update provider active status

    Args:
        provider_name: Name of the provider (e.g., "OpenAI")
        request: Request body containing the active status

    Raises:
        400: If provider is invalid
    """
    try:
        service = ProvidersService()
        service.set_provider_status(
            current_user.username, provider_name, request.active
        )
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating provider status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating provider status",
        )
