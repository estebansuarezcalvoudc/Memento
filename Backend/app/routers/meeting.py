from typing import Annotated
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session
from pydantic import Field

from ..core.logging import setup_logger
from ..models.meeting_model import CreateMeeting, RetrieveMeeting
from ..services.process_meeting import get_session, process_meeting
from .exceptions import AttributeListSizeMismatch

_logger = setup_logger(__name__)
router = APIRouter()


def _parse_meetings_metadata(
    meetings_metadata: Annotated[
        str,
        Form(
            description="JSON array of CreateMeeting objects. Copy and paste the example from the endpoint description above.",
            example='[\n  {\n    "title": "Team Standup",\n    "date": "2025-07-15",\n    "language": "en",\n    "number_of_speakers": 3\n  }\n]',
        ),
    ],
) -> list[CreateMeeting]:
    try:
        meetings_data = json.loads(meetings_metadata)
        return [CreateMeeting(**meeting) for meeting in meetings_data]
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}",
        )


@router.post(
    "/meetings",
    response_model=list[RetrieveMeeting],
    status_code=status.HTTP_201_CREATED,
    summary="Create meetings and process them",
    description="""Create meetings and process them with audio files.

<b>meetings_metadata</b> should be a JSON string containing an array of meeting objects.

<b>Example:</b>
<pre>
[
  {
    "title": "Team Standup",
    "date": "2025-07-15",
    "language": "en",
    "number_of_speakers": 3
  }
]
</pre>

<b>Required fields:</b>
- title: string
- date: string (YYYY-MM-DD format)

<b>Optional fields:</b>
- language: string (e.g., "en", "es")
- number_of_speakers: integer
""",
    openapi_extra={
        "requestBody": {
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "meetings_metadata": {
                                "type": "object",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "date": {"type": "string", "format": "date"},
                                        "language": {"type": "string"},
                                        "number_of_speakers": {"type": "integer"},
                                    },
                                    "required": ["title", "date"],
                                },
                                "default": [
                                    {
                                        "title": "My first meeting",
                                        "date": "2025-07-15",
                                        "language": "es",
                                        "number_of_speakers": 2,
                                    }
                                ],
                            },
                            "audios": {
                                "type": "array",
                                "items": {"type": "string", "format": "binary"},
                                "description": "Audio files corresponding to each meeting",
                            },
                        },
                        "required": ["meetings_metadata", "audios"],
                    }
                }
            }
        }
    },
)
async def create_meetings(
    meetings_list: list[CreateMeeting] = Depends(_parse_meetings_metadata),
    audios: list[UploadFile] = File(
        ..., description="Audio files corresponding to each meeting"
    ),
    session: Session = Depends(get_session),
):
    _logger.debug("Create meetings was called")

    if len(meetings_list) != len(audios):
        raise AttributeListSizeMismatch()

    results = []
    for metadata, audio in zip(meetings_list, audios):
        audio_bytes = await audio.read()
        result = process_meeting(metadata, audio_bytes, session)
        results.append(result)

    return results


@router.post("/app")
async def dummy_example(metadata: CreateMeeting):
    return metadata
