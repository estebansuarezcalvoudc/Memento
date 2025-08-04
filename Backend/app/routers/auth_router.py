from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext

from ..core.logging import setup_logger
from ..core.settings import settings
from ..schemas.auth_schema import Token, User
from ..services.auth_service import AuthService

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

_logger = setup_logger(__name__)


@router.post("/register")
async def register(user: User):
    try:
        auth_service = AuthService()
        auth_service.register(user)
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
    return auth_service.authenticate_user(
        form_data.username, form_data.password, pwd_context
    )
