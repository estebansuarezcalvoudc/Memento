from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ..core.logging import setup_logger
from ..schemas.auth_schema import Token, UserCreate
from ..services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

_logger = setup_logger(__name__)


@router.post("/register")
async def register(user: UserCreate) -> Token:
    try:
        auth_service = AuthService()
        return auth_service.register(user)
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
) -> Token:
    auth_service = AuthService()
    return auth_service.authenticate_user(form_data.username, form_data.password)
