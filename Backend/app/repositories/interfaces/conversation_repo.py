from abc import ABC, abstractmethod
from typing import Optional

from ...schemas.conversation.conversation_schema import (
    ConversationCreateResponse,
    ConversationDialogueRetrieve,
    ConversationMetadataRetrieve,
    ConversationUpdateRequest,
)


class ConversationRepository(ABC):
    """Abstract repository interface for conversation data access"""

    @abstractmethod
    def store_conversation(
        self,
        conversation_title: str,
        user_id: str,
        initial_messages: Optional[list[dict]] = None,
    ) -> ConversationCreateResponse:
        """
        Store a new conversation

        Args:
            conversation_title: Title of the conversation
            user_id: ID of the conversation owner
            initial_messages: Optional initial messages for the conversation

        Returns:
            ConversationCreateResponse with the created conversation data
        """
        pass

    @abstractmethod
    def append_new_messages_to_conversation(
        self,
        conversation_id: str,
        new_messages: list[dict],
        user_id: str,
    ) -> None:
        """
        Append new messages to an existing conversation

        Args:
            conversation_id: ID of the conversation
            new_messages: List of messages to append
            user_id: ID of the conversation owner
        """
        pass

    @abstractmethod
    def retrieve_all_conversations_metadata(
        self, user_id: str
    ) -> list[ConversationMetadataRetrieve]:
        """
        Retrieve metadata for all conversations of a user

        Args:
            user_id: User ID to retrieve conversations for

        Returns:
            List of ConversationMetadataRetrieve objects
        """
        pass

    @abstractmethod
    def fetch_conversation(self, id: str, user_id: str) -> ConversationDialogueRetrieve:
        """
        Fetch a specific conversation dialogue

        Args:
            id: Conversation ID
            user_id: ID of the conversation owner

        Returns:
            ConversationDialogueRetrieve with the conversation messages

        Raises:
            HTTPException: If conversation not found
        """
        pass

    @abstractmethod
    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest, user_id: str
    ) -> None:
        """
        Update conversation metadata

        Args:
            id: Conversation ID
            metadata: New metadata to update
            user_id: ID of the conversation owner

        Raises:
            HTTPException: If conversation not found
        """
        pass

    @abstractmethod
    def delete_conversation(self, id: str, user_id: str) -> None:
        """
        Delete a conversation

        Args:
            id: Conversation ID
            user_id: ID of the conversation owner

        Raises:
            HTTPException: If conversation not found
        """
        pass

    @abstractmethod
    def delete_user_data(self, user_id: str) -> None:
        """
        Delete all conversations belonging to a user

        Args:
            user_id: User ID whose data will be deleted
        """
        pass
