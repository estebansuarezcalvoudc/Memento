import json
from io import BytesIO

from fastapi.testclient import TestClient


def _audio_file(filename: str = "meeting.wav", content_type: str = "audio/wav"):
    return (filename, BytesIO(b"fake audio content"), content_type)


def _meetings_data(
    title: str = "Q1 Planning", date_str: str = "2024-01-15", language: str = "en"
) -> str:
    return json.dumps(
        [
            {"title": title, "date": date_str, "language": language},
        ]
    )


class TestCreateMeetingsEndpoint:
    def test_create_meetings_should_require_authentication(self, client: TestClient):
        response = client.post(
            "/meetings",
            data={"meetings_data": _meetings_data()},
            files=[("audios", _audio_file())],
        )

        assert response.status_code == 401

    def test_create_meetings_should_reject_unsupported_audio_format(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_vector_store
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
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_vector_store
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
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_vector_store
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
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_vector_store
    ):
        # Arrange: two metadata entries but only one audio file
        meetings_data = json.dumps(
            [
                {"title": "Meeting 1", "date": "2024-01-15"},
                {"title": "Meeting 2", "date": "2024-01-16"},
            ]
        )

        response = client.post(
            "/meetings",
            headers=auth_headers,
            data={"meetings_data": meetings_data},
            files=[("audios", _audio_file())],
        )

        assert response.status_code == 422
        assert "must match" in response.json()["detail"].lower()
