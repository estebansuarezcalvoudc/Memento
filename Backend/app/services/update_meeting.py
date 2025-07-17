from fastapi import HTTPException, status
from sqlmodel import Session

from ..models.meeting_model import Meeting, MeetingResponse, UpdateMeetingRequest


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
        id=meeting.id, # type: ignore
        title=meeting.title,
        date=meeting.date,
        transcription=meeting.transcription,
    )

    return response
