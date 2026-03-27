from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str]


class UserCreate(BaseModel):
    username: str
    password: str


class UserCreateInDB(BaseModel):
    username: str
    password: str
    status: Literal["active", "pending_deletion"]
    scheduled_purge_at: Optional[datetime] = None


class UserInDB(BaseModel):
    id: str
    username: str
    password: str
    status: Literal["active", "pending_deletion"] = "active"
    scheduled_purge_at: Optional[datetime] = None


class User(BaseModel):
    id: str
    username: str


class ActiveSession(BaseModel):
    username: str
    access_token: str
    expire_time: datetime


class ChangeUsernameRequest(BaseModel):
    new_username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class DeleteAccountRequest(BaseModel):
    password: str


class AccountDeletionPolicyResponse(BaseModel):
    grace_days: int
    contact_email: str
