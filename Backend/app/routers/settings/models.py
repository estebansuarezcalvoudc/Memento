from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from ...core.logging import setup_logger
from ...dependencies.auth_dependencies import get_current_active_user
from ...schemas.auth_schema import User
from ...schemas.model_schema import (
    AvailableModel,
    ConfiguredModelsRequest,
    ConfiguredModelsResponse,
)
from ...services.settings.models_service import ModelsService

_logger = setup_logger(__name__)
router = APIRouter(prefix="/models", tags=["Settings - Models"])


@router.get("/available", response_model=list[AvailableModel])
async def get_available_models(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> list[AvailableModel]:
    """
    Get all available models from active providers

    Returns:
        List of available models with their provider
    """
    try:
        service = ModelsService()
        return service.get_available_models(current_user.username)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error getting available models: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting available models",
        )


@router.get("/configured", response_model=ConfiguredModelsResponse)
async def get_configured_models(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ConfiguredModelsResponse:
    """
    Get user's configured models for chat and summary

    Returns:
        ConfiguredModelsResponse: Current model configuration
    """
    try:
        service = ModelsService()
        return service.get_configured_models(current_user.username)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error getting configured models: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting configured models",
        )


@router.patch("/configured", response_model=ConfiguredModelsResponse)
async def update_configured_models(
    request: ConfiguredModelsRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ConfiguredModelsResponse:
    """
    Update user's configured models (partial update)

    Args:
        request: Models to update (chat_model and/or summary_model)

    Returns:
        ConfiguredModelsResponse: Updated model configuration
    """
    try:
        service = ModelsService()
        return service.update_configured_models(current_user.username, request)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating configured models: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating configured models",
        )
