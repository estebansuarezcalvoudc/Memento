from sqlmodel import Session, select

from ..models.meeting_model import Meeting, MeetingResponse


def get_all_meetings(session: Session) -> list[MeetingResponse]:
    db_meetings = session.exec(select(Meeting)).all()

    return [
        MeetingResponse(
            id=meeting.id or 0,
            title=meeting.title,
            date=meeting.date,
            transcription=meeting.transcription,
        )
        for meeting in db_meetings
    ]
