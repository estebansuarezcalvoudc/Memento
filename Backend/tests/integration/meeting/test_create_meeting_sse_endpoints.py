import json
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from sse_starlette.sse import AppStatus

from app.services.transcription.interfaces.transcription_service import (
    TranscriptionResult,
)

_PATCH_TRANSCRIBE = "app.services.transcription.implementations.whisperx.whisperx_transcription_service.WhisperXTranscriptionService.transcribe"
_PATCH_SUMMARIZE = "app.services.meeting.meeting_service.get_meeting_summary"


def _audio_file(filename: str, content_type: str = "audio/wav"):
    return (filename, BytesIO(b"fake audio content"), content_type)


def _meetings_data(meetings: list[dict[str, str]]) -> str:
    return json.dumps({"meetings_metadata": meetings})


def _collect_sse_payloads(response) -> list[dict]:
    payloads: list[dict] = []

    for raw_line in response.iter_lines():
        if not raw_line:
            continue

        line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
        if not line.startswith("data: "):
            continue

        payloads.append(json.loads(line.removeprefix("data: ")))

    return payloads


class TestCreateMeetingsSSEEndpoint:
    @pytest.fixture(autouse=True)
    def reset_sse_app_status(self):
        AppStatus.should_exit = False
        AppStatus.should_exit_event = None
        yield
        AppStatus.should_exit = False
        AppStatus.should_exit_event = None

    def test_create_meetings_should_stream_full_success_sequence(
        self,
        client: TestClient,
        auth_headers: dict,
        mock_mongo,
        mock_vector_store,
    ):
        insert_result_1 = MagicMock()
        insert_result_1.inserted_id = ObjectId("507f1f77bcf86cd799439011")
        insert_result_2 = MagicMock()
        insert_result_2.inserted_id = ObjectId("507f1f77bcf86cd799439012")
        mock_mongo.insert_one.side_effect = [insert_result_1, insert_result_2]

        meetings_data = _meetings_data(
            [
                {"title": "Q1 Planning", "date": "2024-01-15", "language": "en"},
                {"title": "Retro", "date": "2024-01-16", "language": "en"},
            ]
        )

        with (
            patch(_PATCH_TRANSCRIBE) as mock_transcribe,
            patch(_PATCH_SUMMARIZE) as mock_summarize,
        ):
            mock_transcribe.side_effect = [
                TranscriptionResult(text="Meeting 1 text", language="en"),
                TranscriptionResult(text="Meeting 2 text", language="en"),
            ]
            mock_summarize.side_effect = ["Summary 1", "Summary 2"]

            with client.stream(
                "POST",
                "/meetings",
                headers=auth_headers,
                data={"meetings_data": meetings_data},
                files=[
                    ("audios", _audio_file("meeting1.wav")),
                    ("audios", _audio_file("meeting2.wav")),
                ],
            ) as response:
                assert response.status_code == 200
                assert response.headers["content-type"].startswith("text/event-stream")
                events = _collect_sse_payloads(response)

        event_types = [event["type"] for event in events]
        assert event_types == [
            "JobStarted",
            "MeetingProcessingStarted",
            "MeetingProcessingSucceeded",
            "MeetingProcessingStarted",
            "MeetingProcessingSucceeded",
            "JobFinished",
        ]

        assert events[0]["total_meetings"] == 2
        assert events[2]["index"] == 0
        assert events[2]["title"] == "Q1 Planning"
        assert isinstance(events[2]["meeting_id"], str)
        assert events[4]["index"] == 1
        assert events[4]["title"] == "Retro"
        assert isinstance(events[4]["meeting_id"], str)
        assert events[5]["meetings_succeeded"] == 2
        assert events[5]["meetings_failed"] == 0

    def test_create_meetings_should_stream_failure_and_continue_processing(
        self,
        client: TestClient,
        auth_headers: dict,
        mock_mongo,
        mock_vector_store,
    ):
        insert_result_1 = MagicMock()
        insert_result_1.inserted_id = ObjectId("507f1f77bcf86cd799439011")
        mock_mongo.insert_one.side_effect = [insert_result_1]

        meetings_data = _meetings_data(
            [
                {"title": "Q1 Planning", "date": "2024-01-15", "language": "en"},
                {"title": "Retro", "date": "2024-01-16", "language": "en"},
            ]
        )

        with (
            patch(_PATCH_TRANSCRIBE) as mock_transcribe,
            patch(_PATCH_SUMMARIZE) as mock_summarize,
        ):
            mock_transcribe.side_effect = [
                TranscriptionResult(text="Meeting 1 text", language="en"),
                RuntimeError("transcription failure"),
            ]
            mock_summarize.return_value = "Summary 1"

            with client.stream(
                "POST",
                "/meetings",
                headers=auth_headers,
                data={"meetings_data": meetings_data},
                files=[
                    ("audios", _audio_file("meeting1.wav")),
                    ("audios", _audio_file("meeting2.wav")),
                ],
            ) as response:
                assert response.status_code == 200
                assert response.headers["content-type"].startswith("text/event-stream")
                events = _collect_sse_payloads(response)

        event_types = [event["type"] for event in events]
        assert event_types == [
            "JobStarted",
            "MeetingProcessingStarted",
            "MeetingProcessingSucceeded",
            "MeetingProcessingStarted",
            "MeetingProcessingFailed",
            "JobFinished",
        ]

        assert events[4]["index"] == 1
        assert events[4]["title"] == "Retro"
        assert "transcription failure" in events[4]["error"]
        assert events[5]["meetings_succeeded"] == 1
        assert events[5]["meetings_failed"] == 1
