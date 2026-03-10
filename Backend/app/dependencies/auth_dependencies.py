from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.repositories.implementations.mongo.auth_mongo_repo import AuthMongoRepository

from ..core.settings import settings
from ..repositories.interfaces.auth_repo import AuthRepository
from ..schemas.auth.auth_schema import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def _get_auth_repository() -> AuthRepository:
    return AuthMongoRepository()


async def _get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    users_repo: Annotated[AuthRepository, Depends(_get_auth_repository)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception

    user = users_repo.retrieve_user_by_id(user_id=user_id)
    if user is None:
        raise credentials_exception

    # Return user without password for security
    return User(id=user.id, username=user.username)


async def get_current_active_user(
    current_user: Annotated[User, Depends(_get_current_user)],
) -> User:
    # Add any additional user validation here if needed
    # For example, check if user is active, not banned, etc.
    return current_user
