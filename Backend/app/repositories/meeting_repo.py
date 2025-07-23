from fastapi import HTTPException, status
from sqlmodel import Session, select

from ..models.meeting_model import (
    CreateMeetingRequest,
    Meeting,
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

    response = MeetingResponse(
        title=meeting.title,
        date=meeting.date,
        id=db_meeting.id or 0,
        transcription=transcription,
        summary=summary,
    )

    session.expunge(db_meeting)
    return response


def retrieve_all_meetings(session: Session) -> list[MeetingResponse]:
    db_meetings = session.exec(select(Meeting)).all()

    return [
        MeetingResponse(
            id=meeting.id or 0,
            title=meeting.title,
            date=meeting.date,
            transcription=meeting.transcription,
            summary=meeting.summary,
        )
        for meeting in db_meetings
    ]


def update_meeting_by_id(
    id: int, meeting_data: UpdateMeetingRequest, session: Session
) -> MeetingResponse:
    meeting = session.get(Meeting, id)

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={id} not found",
        )

    if meeting_data.title:
        meeting.title = meeting_data.title

    if meeting_data.date:
        meeting.date = meeting_data.date

    session.add(meeting)
    session.commit()
    session.refresh(meeting)

    response = MeetingResponse(
        id=meeting.id,  # type: ignore
        title=meeting.title,
        date=meeting.date,
        transcription=meeting.transcription,
    )

    return response


def delete_meeting(id: int, session: Session):
    meeting = session.get(Meeting, id)

    if not meeting:
        raise ValueError(f"Meeting with id={id} not found")

    session.delete(meeting)
    session.commit()
