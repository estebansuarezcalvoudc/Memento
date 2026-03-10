from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ...core.logging import setup_logger
from ...dependencies.auth_dependencies import get_current_active_user
from ...dependencies.service_dependencies import get_models_service
from ...schemas.auth.auth_schema import User
from ...schemas.settings.model_schema import (
    AvailableModel,
    ModelConfig,
    PullModelRequest,
)
from ...services.settings.models_service import ModelsService

_logger = setup_logger(__name__)
router = APIRouter(prefix="/models", tags=["Settings - Models"])


@router.get("/available", response_model=list[AvailableModel])
async def get_available_models(
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ModelsService, Depends(get_models_service)],
) -> list[AvailableModel]:
    """Get all available models from active providers"""
    try:
        return service.get_available_models(current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error getting available models: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting available models",
        )


@router.get("/chat", response_model=ModelConfig | None)
async def get_chat_model(
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ModelsService, Depends(get_models_service)],
) -> ModelConfig | None:
    """Get user's configured chat model"""
    try:
        return service.get_chat_model(current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error getting chat model: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting chat model",
        )


@router.get("/summary", response_model=ModelConfig | None)
async def get_summary_model(
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ModelsService, Depends(get_models_service)],
) -> ModelConfig | None:
    """Get user's configured summary model"""
    try:
        return service.get_summary_model(current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error getting summary model: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting summary model",
        )


@router.put("/chat", response_model=ModelConfig)
async def update_chat_model(
    model: ModelConfig,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ModelsService, Depends(get_models_service)],
) -> ModelConfig:
    """Update user's chat model configuration"""
    try:
        return service.update_chat_model(current_user.id, model)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating chat model: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating chat model",
        )


@router.put("/summary", response_model=ModelConfig)
async def update_summary_model(
    model: ModelConfig,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ModelsService, Depends(get_models_service)],
) -> ModelConfig:
    """Update user's summary model configuration"""
    try:
        return service.update_summary_model(current_user.id, model)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating summary model: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating summary model",
        )


@router.get("/retrieval", response_model=ModelConfig | None)
async def get_retrieval_model(
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ModelsService, Depends(get_models_service)],
) -> ModelConfig | None:
    """Get user's configured retrieval model"""
    try:
        return service.get_retrieval_model(current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error getting retrieval model: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting retrieval model",
        )


@router.put("/retrieval", response_model=ModelConfig)
async def update_retrieval_model(
    model: ModelConfig,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ModelsService, Depends(get_models_service)],
) -> ModelConfig:
    """Update user's retrieval model configuration"""
    try:
        return service.update_retrieval_model(current_user.id, model)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating retrieval model: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating retrieval model",
        )


@router.post("/pull", status_code=status.HTTP_201_CREATED)
async def pull_model(
    pull_model_request: PullModelRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ModelsService, Depends(get_models_service)],
) -> None:
    _ = current_user
    try:
        service.pull_model(pull_model_request)
        return Response(status_code=status.HTTP_201_CREATED)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(
            f"Error pulling model '{pull_model_request.model}' from provider '{pull_model_request.provider}': {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while pulling model",
        )
