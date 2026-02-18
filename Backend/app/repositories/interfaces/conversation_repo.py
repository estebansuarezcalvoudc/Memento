from abc import ABC, abstractmethod

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
        username: str,
        initial_messages: list[dict] | None = None,
    ) -> ConversationCreateResponse:
        """
        Store a new conversation

        Args:
            conversation_title: Title of the conversation
            username: Username of the conversation owner
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
        username: str,
    ) -> None:
        """
        Append new messages to an existing conversation

        Args:
            conversation_id: ID of the conversation
            new_messages: List of messages to append
            username: Username of the conversation owner
        """
        pass

    @abstractmethod
    def retrieve_all_conversations_metadata(
        self, username: str
    ) -> list[ConversationMetadataRetrieve]:
        """
        Retrieve metadata for all conversations of a user

        Args:
            username: Username to retrieve conversations for

        Returns:
            List of ConversationMetadataRetrieve objects
        """
        pass

    @abstractmethod
    def fetch_conversation(
        self, id: str, username: str
    ) -> ConversationDialogueRetrieve:
        """
        Fetch a specific conversation dialogue

        Args:
            id: Conversation ID
            username: Username of the conversation owner

        Returns:
            ConversationDialogueRetrieve with the conversation messages

        Raises:
            HTTPException: If conversation not found
        """
        pass

    @abstractmethod
    def update_conversation_metadata(
        self, id: str, metadata: ConversationUpdateRequest, username: str
    ) -> None:
        """
        Update conversation metadata

        Args:
            id: Conversation ID
            metadata: New metadata to update
            username: Username of the conversation owner

        Raises:
            HTTPException: If conversation not found
        """
        pass

    @abstractmethod
    def delete_conversation(self, id: str, username: str) -> None:
        """
        Delete a conversation

        Args:
            id: Conversation ID
            username: Username of the conversation owner

        Raises:
            HTTPException: If conversation not found
        """
        pass
