from datetime import datetime
from typing import Optional

import pymongo
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from ....core.settings import settings
from ....schemas.auth.auth_schema import UserCreateInDB, UserInDB
from ...interfaces.auth_repo import AuthRepository as AbstractAuthRepository


class AuthMongoRepository(AbstractAuthRepository):
    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["tfg_db"]
        self._collection = mydb["auth"]
        self._collection.create_index("username", unique=True)

    def store_user(self, user: UserCreateInDB) -> str:
        try:
            result = self._collection.insert_one(
                {
                    "username": user.username,
                    "password": user.password,
                    "status": user.status,
                    "scheduled_purge_at": user.scheduled_purge_at,
                }
            )
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists",
            )
        return str(result.inserted_id)

    def retrieve_user(self, username: str) -> Optional[UserInDB]:
        result = self._collection.find_one(
            {"username": username},
            {
                "_id": True,
                "username": True,
                "password": True,
                "status": True,
                "scheduled_purge_at": True,
            },
        )

        if not result:
            return None

        return UserInDB(
            id=str(result["_id"]),
            username=result["username"],
            password=result["password"],
            status=result.get("status", "active"),
            scheduled_purge_at=result.get("scheduled_purge_at"),
        )

    def retrieve_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        try:
            result = self._collection.find_one(
                {"_id": ObjectId(user_id)},
                {
                    "_id": True,
                    "username": True,
                    "password": True,
                    "status": True,
                    "scheduled_purge_at": True,
                },
            )
        except Exception:
            return None

        if not result:
            return None

        return UserInDB(
            id=str(result["_id"]),
            username=result["username"],
            password=result["password"],
            status=result.get("status", "active"),
            scheduled_purge_at=result.get("scheduled_purge_at"),
        )

    def update_username(self, user_id: str, new_username: str) -> None:
        try:
            result = self._collection.update_one(
                {"_id": ObjectId(user_id)}, {"$set": {"username": new_username}}
            )
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists",
            )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    def update_password(self, user_id: str, new_password: str) -> None:
        result = self._collection.update_one(
            {"_id": ObjectId(user_id)}, {"$set": {"password": new_password}}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    def delete_account(self, user_id: str) -> None:
        result = self._collection.delete_one({"_id": ObjectId(user_id)})

        if result.deleted_count != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not delete user with id={user_id}",
            )

    def mark_account_pending_deletion(
        self, user_id: str, scheduled_purge_at: datetime
    ) -> None:
        error_404 = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

        try:
            result = self._collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "status": "pending_deletion",
                        "scheduled_purge_at": scheduled_purge_at,
                    }
                },
            )

        except Exception:
            raise error_404

        if not result or result.matched_count == 0:
            raise error_404

    def list_accounts_pending_purge(self, now: datetime) -> list[UserInDB]:
        result = self._collection.find(
            {
                "status": "pending_deletion",
                "scheduled_purge_at": {"$ne": None, "$lte": now},
            },
            {
                "_id": True,
                "username": True,
                "password": True,
                "status": True,
                "scheduled_purge_at": True,
            },
        )

        return [
            UserInDB(
                id=str(row["_id"]),
                username=row["username"],
                password=row["password"],
                status=row.get("status", "active"),
                scheduled_purge_at=row.get("scheduled_purge_at"),
            )
            for row in result
        ]
