from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext

from ...core.settings import settings
from ...repositories.auth_repo import AuthMongoRepository
from ...schemas.auth.auth_schema import Token, UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self) -> None:
        self._repository = AuthMongoRepository()

    def register(self, user_create: UserCreate) -> Token:
        user = UserCreate(
            username=user_create.username,
            password=pwd_context.hash(user_create.password),
        )

        self._repository.store_user(user)
        return AuthService._create_access_token(data={"sub": user.username})

    @staticmethod
    def _create_access_token(data: dict) -> Token:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
        expire = datetime.now(timezone.utc) + expires_delta

        to_encode = data.copy()
        to_encode.update({"exp": expire})

        access_token = jwt.encode(
            to_encode, settings.secret_key, algorithm=settings.algorithm
        )
        return Token(access_token=access_token, token_type="bearer")

    def authenticate_user(self, username: str, password: str) -> Token:
        user = self._repository.retrieve_user(username)

        if not user or not pwd_context.verify(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthService._create_access_token(data={"sub": user.username})
