from typing import Optional

import pymongo
from fastapi import HTTPException, status

from ....core.settings import settings
from ....schemas.auth.auth_schema import UserCreate
from ...interfaces.auth_repo import AuthRepository as AbstractAuthRepository


class AuthMongoRepository(AbstractAuthRepository):
    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["tfg_db"]
        self._collection = mydb["auth"]

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

    def update_username(self, username: str, new_username: str) -> None:
        result = self._collection.update_one(
            {"username": username}, {"$set": {"username": new_username}}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    def update_password(self, username: str, new_password: str) -> None:
        result = self._collection.update_one(
            {"username": username}, {"$set": {"password": new_password}}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    def delete_account(self, username: str) -> None:
        result = self._collection.delete_one({"username": username})

        if result.deleted_count != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not delete user {username}",
            )
