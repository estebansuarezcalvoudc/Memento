from sqlmodel import Session, select
from ..models.meeting_model import RetrieveMeeting


def get_all_meetings(session: Session):
    meetings = session.exec(select(RetrieveMeeting)).all()
    return meetings
