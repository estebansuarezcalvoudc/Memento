from sqlmodel import Session
from fastapi import HTTPException, status
from ..models.meeting_model import UpdateMeeting, RetrieveMeeting


def update_meeting_by_id(
    id: int, meeting_data: UpdateMeeting, session: Session
) -> RetrieveMeeting:
    meeting = session.get(RetrieveMeeting, id)

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={id} not found",
        )

    if meeting_data.title:
        meeting.title = meeting_data.title

    if meeting_data.meeting_date:
        meeting.date = meeting_data.meeting_date

    session.add(meeting)
    session.commit()
    session.refresh(meeting)

    return meeting
