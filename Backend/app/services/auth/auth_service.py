from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from langchain_core.vectorstores import VectorStore
from passlib.context import CryptContext

from ...core.settings import settings
from ...repositories.interfaces.auth_repo import AuthRepository
from ...repositories.interfaces.conversation_repo import ConversationRepository
from ...repositories.interfaces.meeting_repo import MeetingRepository
from ...repositories.interfaces.settings_repo import SettingsRepository
from ...schemas.auth.auth_schema import Token, UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(
        self,
        repository: AuthRepository,
        meeting_repository: MeetingRepository,
        conversation_repository: ConversationRepository,
        settings_repository: SettingsRepository,
        vector_store: VectorStore,
    ) -> None:
        self._repository: AuthRepository = repository
        self._meeting_repository = meeting_repository
        self._conversation_repository = conversation_repository
        self._settings_repository = settings_repository
        self._vector_store = vector_store

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

    def change_username(self, username: str, new_username: str, password: str) -> Token:
        user = self._repository.retrieve_user(username)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist"
            )

        if not pwd_context.verify(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="The introduced password is not correct",
            )

        if self._repository.retrieve_user(new_username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists",
            )

        try:
            self._repository.update_username(username, new_username)
        except HTTPException:
            raise
        except Exception as exc:
            # Handle potential race condition where another user claimed the username
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists",
            ) from exc
        return AuthService._create_access_token(data={"sub": new_username})

    def change_password(
        self, username: str, current_password: str, new_password: str
    ) -> None:
        user = self._repository.retrieve_user(username)

        if not user or not pwd_context.verify(current_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password",
            )

        self._repository.update_password(username, pwd_context.hash(new_password))

    def delete_account(self, username: str, password: str) -> None:
        user = self._repository.retrieve_user(username)

        if not user or not pwd_context.verify(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password"
            )

        self._meeting_repository.delete_user_data(username)
        self._conversation_repository.delete_user_data(username)
        self._settings_repository.delete_user_data(username)
        self._vector_store.delete(where={"username": username})
        self._repository.delete_account(username)
