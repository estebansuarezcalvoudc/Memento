from typing import Annotated

from fastapi import APIRouter, Depends

from ...dependencies.auth_dependencies import get_current_active_user
from ...repositories.settings import SettingsMongoRepository
from ...schemas.auth.auth_schema import User
from ...schemas.settings.templates_schema import (
    SystemPromptResponse,
    SystemPromptUpdate,
)
from ...services.settings.templates_service import TemplatesService

router = APIRouter(prefix="/templates", tags=["Settings - Templates"])


def get_templates_service() -> TemplatesService:
    """Dependency to get TemplatesService instance"""
    return TemplatesService(SettingsMongoRepository())


@router.get("/default-prompt", response_model=SystemPromptResponse)
def get_default_prompt(
    service: Annotated[TemplatesService, Depends(get_templates_service)],
) -> SystemPromptResponse:
    """
    Get the default system prompt from the application

    This is the built-in prompt that users can use as a reference or starting point
    for their custom prompts. Does not require authentication.
    """
    return service.get_default_prompt()


@router.get("/prompt", response_model=SystemPromptResponse)
def get_user_prompt(
    user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[TemplatesService, Depends(get_templates_service)],
) -> SystemPromptResponse:
    """
    Get current user's system prompt

    Returns the user's custom prompt if configured, otherwise returns the default
    system prompt.
    """
    return service.get_user_prompt(user.username)


@router.put("/prompt", response_model=SystemPromptResponse)
def update_user_prompt(
    update: SystemPromptUpdate,
    user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[TemplatesService, Depends(get_templates_service)],
) -> SystemPromptResponse:
    """
    Update user's system prompt

    Allows users to customize the prompt used for meeting summarization.
    The prompt must be between 50-5000 characters.
    """
    return service.update_user_prompt(user.username, update)
