from datetime import datetime

from bson import ObjectId
from fastapi.testclient import TestClient

VALID_MEETING_ID = "507f1f77bcf86cd799439011"

_USER_DATA = {"username": "test@example.com", "password": "$2b$12$test_hashed_password"}


def _mongo_side_effect(meeting_data):
    """
    Differentiates auth lookups (no _id in query) from meeting lookups (_id
    present in query), since both hit the same mock collection.
    """
    def side_effect(query, projection=None):
        if "_id" in query:
            return meeting_data
        return _USER_DATA

    return side_effect


class TestRetrieveAllMeetingsEndpoint:
    def test_retrieve_all_meetings_should_return_list_of_user_meetings(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find.return_value = [
            {
                "_id": ObjectId(VALID_MEETING_ID),
                "title": "Q1 Planning",
                "date": datetime(2024, 1, 15),
                "language": "en",
            }
        ]

        response = client.get("/meetings", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["title"] == "Q1 Planning"
        assert data[0]["id"] == VALID_MEETING_ID
        mock_mongo.find.assert_called_once()

    def test_retrieve_all_meetings_should_return_empty_list_when_user_has_no_meetings(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find.return_value = []

        response = client.get("/meetings", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == []

    def test_retrieve_all_meetings_should_require_authentication(
        self, client: TestClient
    ):
        response = client.get("/meetings")

        assert response.status_code == 401


class TestRetrieveMeetingSummaryEndpoint:
    def test_retrieve_summary_should_return_summary_of_existing_meeting(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            meeting_data={
                "summary": "The team agreed on Q1 targets.",
                "title": "Q1 Planning",
                "date": datetime(2024, 1, 15),
            }
        )

        response = client.get(
            f"/meetings/meetings/summary/{VALID_MEETING_ID}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == "The team agreed on Q1 targets."
        assert data["title"] == "Q1 Planning"

    def test_retrieve_summary_should_return_404_when_meeting_does_not_exist(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(meeting_data=None)

        response = client.get(
            f"/meetings/meetings/summary/{VALID_MEETING_ID}", headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_retrieve_summary_should_return_422_for_invalid_meeting_id_format(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        response = client.get(
            "/meetings/meetings/summary/not-a-valid-id", headers=auth_headers
        )

        assert response.status_code == 422

    def test_retrieve_summary_should_require_authentication(self, client: TestClient):
        response = client.get(f"/meetings/meetings/summary/{VALID_MEETING_ID}")

        assert response.status_code == 401


class TestRetrieveMeetingTranscriptionEndpoint:
    def test_retrieve_transcription_should_return_transcription_of_existing_meeting(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            meeting_data={
                "transcription": "Speaker 1: Hello.\nSpeaker 2: Hi!",
                "title": "Q1 Planning",
                "date": datetime(2024, 1, 15),
            }
        )

        response = client.get(
            f"/meetings/meetings/transcription/{VALID_MEETING_ID}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["transcription"] == "Speaker 1: Hello.\nSpeaker 2: Hi!"
        assert data["title"] == "Q1 Planning"

    def test_retrieve_transcription_should_return_404_when_meeting_does_not_exist(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(meeting_data=None)

        response = client.get(
            f"/meetings/meetings/transcription/{VALID_MEETING_ID}", headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_retrieve_transcription_should_return_422_for_invalid_meeting_id_format(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        response = client.get(
            "/meetings/meetings/transcription/not-a-valid-id", headers=auth_headers
        )

        assert response.status_code == 422

    def test_retrieve_transcription_should_require_authentication(
        self, client: TestClient
    ):
        response = client.get(f"/meetings/meetings/transcription/{VALID_MEETING_ID}")

        assert response.status_code == 401
