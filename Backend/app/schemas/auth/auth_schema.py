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


class User(BaseModel):
    """User schema for authenticated users (without password)"""

    username: str


class ActiveSession(BaseModel):
    username: str
    access_token: str
    expire_time: datetime.datetime
