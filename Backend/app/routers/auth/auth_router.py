from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ...core.logging import setup_logger
from ...dependencies.auth_dependencies import get_current_active_user
from ...dependencies.service_dependencies import get_auth_service
from ...schemas.auth.auth_schema import (
    ChangePasswordRequest,
    ChangeUsernameRequest,
    DeleteAccountRequest,
    Token,
    User,
    UserCreate,
)
from ...services.auth.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

_logger = setup_logger(__name__)


@router.post("/register")
async def register(
    user: UserCreate,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    try:
        return service.register(user)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error registering user: {str(e)}", exc_info=True)
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while registering user",
        )


@router.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    return service.authenticate_user(form_data.username, form_data.password)


@router.patch("/username")
async def change_username(
    body: ChangeUsernameRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    try:
        return service.change_username(
            current_user.username, body.new_username, body.password
        )
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error changing username: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while changing username",
        )


@router.patch("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> None:
    try:
        service.change_password(
            current_user.username, body.current_password, body.new_password
        )
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error changing password: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while changing password",
        )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    body: DeleteAccountRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> None:
    try:
        service.delete_account(current_user.username, body.password)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error deleting account: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting account",
        )
