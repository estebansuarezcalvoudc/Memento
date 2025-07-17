from sqlmodel import Session, select

from ..models.meeting_model import RetrieveMeeting


def get_all_meetings(session: Session):
    return session.exec(select(RetrieveMeeting)).all()
