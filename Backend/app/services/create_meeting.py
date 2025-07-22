from ..models.meeting_model import Meeting, MeetingResponse, CreateMeetingRequest
from sqlmodel import Session


def create_meeting(
    session: Session, meeting: CreateMeetingRequest, transcription: str, summary: str
):
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
