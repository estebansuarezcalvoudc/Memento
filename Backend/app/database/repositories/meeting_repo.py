from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.meeting_model import Meeting
from ...schemas.meeting_schema import (
    CreateMeetingRequest,
    MeetingResponse,
    UpdateMeetingRequest,
)


def create_meeting(
    session: Session, meeting: CreateMeetingRequest, transcription: str, summary: str
) -> MeetingResponse:
    db_meeting = Meeting(
        title=meeting.title,
        date=meeting.date,
        transcription=transcription,
        summary=summary,
    )

    session.add(db_meeting)
    session.commit()
    session.refresh(db_meeting)

    return MeetingResponse.model_validate(db_meeting)


def retrieve_all_meetings(session: Session) -> list[MeetingResponse]:
    db_meetings = session.query(Meeting).all()
    return [MeetingResponse.model_validate(meeting) for meeting in db_meetings]


def update_meeting_by_id(
    id: int, meeting_data: UpdateMeetingRequest, session: Session
) -> MeetingResponse:
    meeting = session.query(Meeting).filter(Meeting.id == id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={id} not found",
        )

    if meeting_data.title is not None:
        meeting.title = meeting_data.title

    if meeting_data.date is not None:
        meeting.date = meeting_data.date

    session.commit()
    session.refresh(meeting)

    return MeetingResponse.model_validate(meeting)


def delete_meeting(id: int, session: Session) -> None:
    meeting = session.query(Meeting).filter(Meeting.id == id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={id} not found",
        )

    session.delete(meeting)
    session.commit()
