import datetime
from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str]


class UserCreate(BaseModel):
    username: str
    password: str


class UserInDB(BaseModel):
    """User schema with id and password (for internal use only)"""

    id: str
    username: str
    password: str


class User(BaseModel):
    """User schema for authenticated users (without password)"""

    id: str
    username: str


class ActiveSession(BaseModel):
    username: str
    access_token: str
    expire_time: datetime.datetime


class ChangeUsernameRequest(BaseModel):
    new_username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class DeleteAccountRequest(BaseModel):
    password: str
