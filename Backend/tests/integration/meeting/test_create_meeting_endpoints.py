import json
from io import BytesIO
from unittest.mock import patch

from bson import ObjectId
from fastapi.testclient import TestClient

VALID_MEETING_ID = "507f1f77bcf86cd799439011"

from app.services.transcription.interfaces.transcription_service import TranscriptionResult

_PATCH_TRANSCRIBE = "app.services.transcription.implementations.whisperx.whisperx_transcription_service.WhisperXTranscriptionService.transcribe"
_PATCH_SUMMARIZE = "app.services.meeting.meeting_service.get_meeting_summary"


def _audio_file(filename: str = "meeting.wav", content_type: str = "audio/wav"):
    return (filename, BytesIO(b"fake audio content"), content_type)


def _meetings_data(
    title: str = "Q1 Planning", date_str: str = "2024-01-15", language: str = "en"
) -> str:
    return json.dumps(
        {
            "meetings_metadata": [
                {"title": title, "date": date_str, "language": language}
            ]
        }
    )


class TestCreateMeetingsEndpoint:
    def test_create_meetings_should_process_audio_and_return_201(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.insert_one.return_value.inserted_id = ObjectId(VALID_MEETING_ID)

        with (
            patch(_PATCH_TRANSCRIBE) as mock_transcribe,
            patch(_PATCH_SUMMARIZE) as mock_summarize,
        ):
            mock_transcribe.return_value = TranscriptionResult(text="Speaker 1: Hello.", language="en")
            mock_summarize.return_value = "The team discussed Q1 goals."

            response = client.post(
                "/meetings",
                headers=auth_headers,
                data={"meetings_data": _meetings_data()},
                files=[("audios", _audio_file())],
            )

        assert response.status_code == 201
        mock_mongo.insert_one.assert_called_once()
        mock_elasticsearch.index.assert_called_once()

    def test_create_meetings_should_require_authentication(self, client: TestClient):
        response = client.post(
            "/meetings",
            data={"meetings_data": _meetings_data()},
            files=[("audios", _audio_file())],
        )

        assert response.status_code == 401

    def test_create_meetings_should_reject_unsupported_audio_format(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        response = client.post(
            "/meetings",
            headers=auth_headers,
            data={"meetings_data": _meetings_data()},
            files=[("audios", _audio_file("meeting.txt", "audio/wav"))],
        )

        assert response.status_code == 415
        assert "unsupported audio format" in response.json()["detail"].lower()

    def test_create_meetings_should_reject_non_audio_content_type(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        response = client.post(
            "/meetings",
            headers=auth_headers,
            data={"meetings_data": _meetings_data()},
            files=[("audios", _audio_file("meeting.wav", "application/octet-stream"))],
        )

        assert response.status_code == 415
        assert "not an audio file" in response.json()["detail"].lower()

    def test_create_meetings_should_reject_invalid_meetings_data_json(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        response = client.post(
            "/meetings",
            headers=auth_headers,
            data={"meetings_data": "this is not valid json"},
            files=[("audios", _audio_file())],
        )

        assert response.status_code == 400
        assert "invalid json format" in response.json()["detail"].lower()

    def test_create_meetings_should_fail_when_metadata_count_mismatches_audio_files(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        # Arrange: two metadata entries but only one audio file
        meetings_data = json.dumps(
            {
                "meetings_metadata": [
                    {"title": "Meeting 1", "date": "2024-01-15"},
                    {"title": "Meeting 2", "date": "2024-01-16"},
                ]
            }
        )

        with (
            patch(_PATCH_TRANSCRIBE),
            patch(_PATCH_SUMMARIZE),
        ):
            response = client.post(
                "/meetings",
                headers=auth_headers,
                data={"meetings_data": meetings_data},
                files=[("audios", _audio_file())],
            )

        assert response.status_code == 422
        assert "must match" in response.json()["detail"].lower()
