import json
from io import BytesIO
from unittest.mock import patch

from bson import ObjectId
from fastapi.testclient import TestClient

VALID_MEETING_ID = "507f1f77bcf86cd799439011"

_PATCH_WHISPERX = "app.services.meeting.meeting_service.whisperx"
_PATCH_TRANSCRIBE = "app.services.meeting.meeting_service.get_transcribed_conversation"
_PATCH_SUMMARIZE = "app.services.meeting.meeting_service.get_meeting_summary"


def _audio_file(filename: str = "meeting.wav", content_type: str = "audio/wav"):
    return (filename, BytesIO(b"fake audio content"), content_type)


def _meetings_data(title: str = "Q1 Planning", date_str: str = "2024-01-15", language: str = "en") -> str:
    return json.dumps(
        {"meetings_metadata": [{"title": title, "date": date_str, "language": language}]}
    )


class TestCreateMeetingsEndpoint:
    def test_create_meetings_should_process_audio_and_return_201(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        """Test that POST /meetings processes audio, stores meeting and returns 201"""
        mock_mongo.insert_one.return_value.inserted_id = ObjectId(VALID_MEETING_ID)

        with (
            patch(_PATCH_WHISPERX) as mock_wx,
            patch(_PATCH_TRANSCRIBE) as mock_transcribe,
            patch(_PATCH_SUMMARIZE) as mock_summarize,
        ):
            mock_wx.load_audio.return_value = b"audio_array"
            mock_transcribe.return_value = ("Speaker 1: Hello.", "en")
            mock_summarize.return_value = "The team discussed Q1 goals."

            # Act
            response = client.post(
                "/meetings",
                headers=auth_headers,
                data={"meetings_data": _meetings_data()},
                files=[("audios", _audio_file())],
            )

        # Assert
        assert response.status_code == 201
        mock_mongo.insert_one.assert_called_once()
        mock_elasticsearch.index.assert_called_once()

    def test_create_meetings_should_require_authentication(self, client: TestClient):
        """Test that POST /meetings returns 401 without authentication"""
        # Act
        response = client.post(
            "/meetings",
            data={"meetings_data": _meetings_data()},
            files=[("audios", _audio_file())],
        )

        # Assert
        assert response.status_code == 401

    def test_create_meetings_should_reject_unsupported_audio_format(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        """Test that POST /meetings returns 415 for unsupported file extension"""
        # Act
        response = client.post(
            "/meetings",
            headers=auth_headers,
            data={"meetings_data": _meetings_data()},
            files=[("audios", _audio_file("meeting.txt", "audio/wav"))],
        )

        # Assert
        assert response.status_code == 415
        assert "unsupported audio format" in response.json()["detail"].lower()

    def test_create_meetings_should_reject_non_audio_content_type(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        """Test that POST /meetings returns 415 when file content type is not audio"""
        # Act
        response = client.post(
            "/meetings",
            headers=auth_headers,
            data={"meetings_data": _meetings_data()},
            files=[("audios", _audio_file("meeting.wav", "application/octet-stream"))],
        )

        # Assert
        assert response.status_code == 415
        assert "not an audio file" in response.json()["detail"].lower()

    def test_create_meetings_should_reject_invalid_meetings_data_json(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        """Test that POST /meetings returns 400 when meetings_data is not valid JSON"""
        # Act
        response = client.post(
            "/meetings",
            headers=auth_headers,
            data={"meetings_data": "this is not valid json"},
            files=[("audios", _audio_file())],
        )

        # Assert
        assert response.status_code == 400
        assert "invalid json format" in response.json()["detail"].lower()

    def test_create_meetings_should_fail_when_metadata_count_mismatches_audio_files(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        """Test that POST /meetings returns 422 when metadata count does not match audio files"""
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
            patch(_PATCH_WHISPERX),
            patch(_PATCH_TRANSCRIBE),
            patch(_PATCH_SUMMARIZE),
        ):
            # Act
            response = client.post(
                "/meetings",
                headers=auth_headers,
                data={"meetings_data": meetings_data},
                files=[("audios", _audio_file())],
            )

        # Assert
        assert response.status_code == 422
        assert "must match" in response.json()["detail"].lower()
