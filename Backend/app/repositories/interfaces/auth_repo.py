from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from ...schemas.auth.auth_schema import UserCreateInDB, UserInDB


class AuthRepository(ABC):
    """Abstract repository interface for authentication data access"""

    @abstractmethod
    def store_user(self, user: UserCreateInDB) -> str:
        """
        Store a new user in the data store

        Args:
            user: User data to store

        Returns:
            The generated user id (str)

        Raises:
            HTTPException: If user already exists
        """

    @abstractmethod
    def retrieve_user(self, username: str) -> Optional[UserInDB]:
        """
        Retrieve a user by username

        Args:
            username: Username to search for

        Returns:
            UserInDB object if found, None otherwise
        """

    @abstractmethod
    def retrieve_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """
        Retrieve a user by their id

        Args:
            user_id: The user's id (str representation of ObjectId)

        Returns:
            UserInDB object if found, None otherwise
        """

    @abstractmethod
    def update_username(self, user_id: str, new_username: str) -> None:
        """
        Update a user's username

        Args:
            user_id: The user's id
            new_username: New username to set

        Raises:
            HTTPException: 404 if user is not found
        """

    @abstractmethod
    def update_password(self, user_id: str, new_password: str) -> None:
        """
        Update a user's password

        Args:
            user_id: The user's id
            new_password: New (already hashed) password to set

        Raises:
            HTTPException: 404 if user is not found
        """

    @abstractmethod
    def delete_account(self, user_id: str) -> None:
        """
        Delete a user's account

        Args:
            user_id: The user's id

        Raises:
            HTTPException: 400 if user could not be deleted
        """

    @abstractmethod
    def mark_account_pending_deletion(
        self, user_id: str, scheduled_purge_at: datetime
    ) -> None:
        """
        Mark a user account as pending deletion.

        Args:
            user_id: The user's id
            scheduled_purge_at: Datetime when data should be permanently purged

        Raises:
            HTTPException: 404 if user is not found
        """

    @abstractmethod
    def list_accounts_pending_purge(self, now: datetime) -> list[UserInDB]:
        """
        List accounts scheduled for purge at or before the provided datetime.

        Args:
            now: Cutoff datetime

        Returns:
            List of users pending deletion that are due for purge
        """
