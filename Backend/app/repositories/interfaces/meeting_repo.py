from abc import ABC, abstractmethod

from ...schemas.meeting.meeting_schema import MeetingMetadata as MeetingMetadataSchema
from ...schemas.meeting.meeting_schema import (
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    UpdateMeetingMetadata,
)


class MeetingRepository(ABC):
    """Abstract repository interface for meeting data access"""

    @abstractmethod
    def store_meeting(
        self,
        meeting_metadata: MeetingMetadataSchema,
        summary: str,
        transcription: str,
        username: str,
    ) -> MeetingMetadataResponse:
        """
        Store a new meeting

        Args:
            meeting_metadata: Meeting metadata
            summary: Meeting summary
            transcription: Meeting transcription
            username: Username of the meeting owner

        Returns:
            MeetingMetadataResponse with the created meeting data
        """
        pass

    @abstractmethod
    def retrieve_all_meetings_metadata(
        self, username: str
    ) -> list[MeetingMetadataResponse]:
        """
        Retrieve metadata for all meetings of a user

        Args:
            username: Username to retrieve meetings for

        Returns:
            List of MeetingMetadataResponse objects
        """
        pass

    @abstractmethod
    def retrieve_meeting_summary(
        self, id: str, username: str
    ) -> MeetingSummaryResponse:
        """
        Retrieve a meeting summary

        Args:
            id: Meeting ID
            username: Username of the meeting owner

        Returns:
            MeetingSummaryResponse with the meeting summary

        Raises:
            HTTPException: If meeting not found
        """
        pass

    @abstractmethod
    def retrieve_meeting_transcription(
        self, id: str, username: str
    ) -> MeetingTranscriptionResponse:
        """
        Retrieve a meeting transcription

        Args:
            id: Meeting ID
            username: Username of the meeting owner

        Returns:
            MeetingTranscriptionResponse with the meeting transcription

        Raises:
            HTTPException: If meeting not found
        """
        pass

    @abstractmethod
    def update_meeting_metadata(
        self, id: str, new_meeting_metadata: UpdateMeetingMetadata, username: str
    ) -> None:
        """
        Update meeting metadata

        Args:
            id: Meeting ID
            new_meeting_metadata: New metadata to update
            username: Username of the meeting owner

        Raises:
            HTTPException: If meeting not found
        """
        pass

    @abstractmethod
    def delete_meeting(self, id: str, username: str) -> None:
        """
        Delete a meeting

        Args:
            id: Meeting ID
            username: Username of the meeting owner

        Raises:
            HTTPException: If meeting not found
        """
        pass

    @abstractmethod
    def delete_user_data(self, username: str) -> None:
        """
        Delete all meetings belonging to a user

        Args:
            username: Username whose data will be deleted
        """
        pass
