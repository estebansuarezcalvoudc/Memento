from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.meeting_model import MeetingMetadata, MeetingSummary, MeetingTranscription
from ...schemas.meeting_schema import (
    CreateMeetingRequest,
    UpdateMeetingMetadata,
    MeetingMetadataResponse,
    MeetingSummaryResponse,
    MeetingTranscriptionResponse,
    MeetingResponse,
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
        meeting_metadata = MeetingMetadata(title=meeting.title, date=meeting.date)
        self.session.add(meeting_metadata)
        self.session.flush()

        meeting_summary = MeetingSummary(id=meeting_metadata.id, summary=summary)
        self.session.add(meeting_summary)

        meeting_transcription = MeetingTranscription(
            id=meeting_metadata.id, transcription=transcription
        )
        self.session.add(meeting_transcription)

        self.session.commit()
        self.session.refresh(meeting_metadata)
        self.session.refresh(meeting_summary)
        self.session.refresh(meeting_transcription)

        return MeetingResponse(
            id=meeting_metadata.id,
            title=meeting_metadata.title,
            date=meeting_metadata.date,
            summary=meeting_summary.summary,
            transcription=meeting_transcription.transcription,
        )

    def retrieve_all_meetings_metadata(self) -> list[MeetingMetadataResponse]:
        meetings = self.session.query(MeetingMetadata).all()
        return [MeetingMetadataResponse.model_validate(meeting) for meeting in meetings]

    def retrieve_meeting_summary(self, id: int) -> MeetingSummaryResponse:
        meeting = (
            self.session.query(MeetingSummary).filter(MeetingSummary.id == id).first()
        )

        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting summary with id={id} not found",
            )

        return MeetingSummaryResponse.model_validate(meeting)

    def retrieve_meeting_transcription(self, id: int) -> MeetingTranscriptionResponse:
        meeting = (
            self.session.query(MeetingTranscription)
            .filter(MeetingTranscription.id == id)
            .first()
        )

        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting transcription with id={id} not found",
            )

        return MeetingTranscriptionResponse.model_validate(meeting)

    def update_meeting_metadata(
        self, id: int, meeting_data: UpdateMeetingMetadata
    ) -> MeetingMetadataResponse:
        meeting = (
            self.session.query(MeetingMetadata).filter(MeetingMetadata.id == id).first()
        )

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

        return MeetingMetadataResponse.model_validate(meeting)

    def delete_meeting(self, id: int) -> None:
        meeting = (
            self.session.query(MeetingMetadata).filter(MeetingMetadata.id == id).first()
        )

        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with id={id} not found",
            )

        self.session.delete(meeting)
        self.session.commit()
