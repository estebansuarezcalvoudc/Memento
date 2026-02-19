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
        pass

    @abstractmethod
    def retrieve_user(self, username: str) -> Optional[UserCreate]:
        """
        Retrieve a user by username

        Args:
            username: Username to search for

        Returns:
            UserCreate object if found, None otherwise
        """
        pass
