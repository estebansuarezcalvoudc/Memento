from fastapi import HTTPException, status
from sqlmodel import Session

from ..models.meeting_model import Meeting


def delete_meeting_by_id(id: int, session: Session):
    meeting = session.get(Meeting, id)

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={id} not found",
        )

    session.delete(meeting)
    session.commit()
