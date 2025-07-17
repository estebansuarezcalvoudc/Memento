from fastapi import HTTPException, status
from sqlmodel import Session

from ..models.meeting_model import RetrieveMeeting


def delete_meeting_by_id(id: int, session: Session):
    meeting = session.get(RetrieveMeeting, id)

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found"
        )

    session.delete(meeting)
    session.commit()
