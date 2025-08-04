import pymongo
from fastapi import HTTPException, status
from ...schemas.auth_schema import UserCreate
from ...core.settings import settings


class UsersRepo:
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

    def retrieve_user(self, id: str):
        result = self._collection.find_one(
            {"_id": id}, {"_id": False, "username": True, "password": True}
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id={id} not found",
            )

        return UserCreate(username=result["username"], password=result["password"])
