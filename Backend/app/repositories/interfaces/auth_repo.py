from abc import ABC, abstractmethod
from typing import Optional

from ...schemas.auth.auth_schema import UserCreate


class AuthRepository(ABC):
    """Abstract repository interface for authentication data access"""

    @abstractmethod
    def store_user(self, user: UserCreate) -> None:
        """
        Store a new user in the data store

        Args:
            user: User data to store

        Raises:
            HTTPException: If user already exists
        """

    @abstractmethod
    def retrieve_user(self, username: str) -> Optional[UserCreate]:
        """
        Retrieve a user by username

        Args:
            username: Username to search for

        Returns:
            UserCreate object if found, None otherwise
        """

    @abstractmethod
    def update_username(self, username: str, new_username: str) -> None:
        """
        Update a user's username

        Args:
            username: Current username
            new_username: New username to set

        Raises:
            HTTPException: 404 if user is not found
        """

    @abstractmethod
    def update_password(self, username: str, new_password: str) -> None:
        """
        Update a user's password

        Args:
            username: Username of the user
            new_password: New (already hashed) password to set

        Raises:
            HTTPException: 404 if user is not found
        """

    @abstractmethod
    def delete_account(self, username: str) -> None:
        """
        Delete a user's account

        Args:
            username: Username of the user

        Raises:
            HTTPException: 400 if user could not be deleted
        """
