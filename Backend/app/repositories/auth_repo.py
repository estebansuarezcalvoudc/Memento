from typing import Optional

import pymongo
from fastapi import HTTPException, status

from ...core.settings import settings
from ...schemas.auth_schema import UserCreate


class AuthRepository:
    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["users_db"]
        self._collection = mydb["users"]

    def store_user(self, user: UserCreate) -> None:
        existing_user = self._collection.find_one({"username": user.username})
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists",
            )

        self._collection.insert_one(
            {"username": user.username, "password": user.password}
        )

    def retrieve_user(self, username: str) -> Optional[UserCreate]:
        result = self._collection.find_one(
            {"username": username}, {"_id": False, "username": True, "password": True}
        )

        if not result:
            return None

        return UserCreate(username=result["username"], password=result["password"])
