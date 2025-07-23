from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.meeting_model import Meeting
from ...schemas.meeting_schema import (
    CreateMeetingRequest,
    MeetingResponse,
    UpdateMeetingRequest,
)


class MeetingRepository:
    """
    Repository layer for meeting database operations.
    Handles all database interactions for meetings.
    """

    def __init__(self, session: Session):
        self.session = session

    def create_meeting(
        self, meeting: CreateMeetingRequest, transcription: str, summary: str
    ) -> MeetingResponse:
        """
        Create a new meeting in the database.

        Args:
            meeting: Meeting metadata
            transcription: Meeting transcription text
            summary: Meeting summary text

        Returns:
            Created meeting response
        """
        db_meeting = Meeting(
            title=meeting.title,
            date=meeting.date,
            transcription=transcription,
            summary=summary,
        )

        self.session.add(db_meeting)
        self.session.commit()
        self.session.refresh(db_meeting)

        return MeetingResponse.model_validate(db_meeting)

    def retrieve_all_meetings(self) -> list[MeetingResponse]:
        """
        Retrieve all meetings from the database.

        Returns:
            List of all meetings
        """
        db_meetings = self.session.query(Meeting).all()
        return [MeetingResponse.model_validate(meeting) for meeting in db_meetings]

    def update_meeting_by_id(
        self, id: int, meeting_data: UpdateMeetingRequest
    ) -> MeetingResponse:
        """
        Update an existing meeting by ID.

        Args:
            id: Meeting ID to update
            meeting_data: Updated meeting data

        Returns:
            Updated meeting response

        Raises:
            HTTPException: If meeting not found
        """
        meeting = self.session.query(Meeting).filter(Meeting.id == id).first()

        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} not found",
            )

        if meeting_data.title is not None:
            meeting.title = meeting_data.title

        if meeting_data.date is not None:
            meeting.date = meeting_data.date

        self.session.commit()
        self.session.refresh(meeting)

        return MeetingResponse.model_validate(meeting)

    def delete_meeting(self, id: int) -> None:
        """
        Delete a meeting by ID.

        Args:
            id: Meeting ID to delete

        Raises:
            HTTPException: If meeting not found
        """
        meeting = self.session.query(Meeting).filter(Meeting.id == id).first()

        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} not found",
            )

        self.session.delete(meeting)
        self.session.commit()
