from typing import Literal

from pydantic import BaseModel


class JobStarted(BaseModel):
    type: Literal["JobStarted"] = "JobStarted"
    total_meetings: int


class MeetingProcessingStarted(BaseModel):
    type: Literal["MeetingProcessingStarted"] = "MeetingProcessingStarted"
    index: int
    title: str


class MeetingProcessingSucceeded(BaseModel):
    type: Literal["MeetingProcessingSucceeded"] = "MeetingProcessingSucceeded"
    index: int
    title: str
    meeting_id: str


class MeetingProcessingFailed(BaseModel):
    type: Literal["MeetingProcessingError"] = "MeetingProcessingError"
    index: int
    title: str
    error: str


class JobFinished(BaseModel):
    type: Literal["JobFinished"] = "JobFinished"
    meetings_succeeded: int
    meetings_failed: int


MeetingUploadEvent = (
    JobStarted
    | MeetingProcessingStarted
    | MeetingProcessingSucceeded
    | MeetingProcessingFailed
    | JobFinished
)
