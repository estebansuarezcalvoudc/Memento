from datetime import datetime

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


class TestUpdateMeetingEndpoint:
    def test_update_meeting_should_persist_changes_and_return_204(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            meeting_data={"title": "Old Title", "date": datetime(2024, 1, 15), "language": "en"}
        )

        response = client.patch(
            f"/meetings/{VALID_MEETING_ID}",
            headers=auth_headers,
            json={"title": "Updated Title"},
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        mock_elasticsearch.update.assert_called_once()

    def test_update_meeting_should_allow_updating_only_date(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            meeting_data={"title": "Q1 Planning", "date": datetime(2024, 1, 15), "language": "en"}
        )

        response = client.patch(
            f"/meetings/{VALID_MEETING_ID}",
            headers=auth_headers,
            json={"date": "2024-06-01"},
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()

    def test_update_meeting_should_return_404_when_meeting_does_not_exist(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(meeting_data=None)

        response = client.patch(
            f"/meetings/{VALID_MEETING_ID}",
            headers=auth_headers,
            json={"title": "New Title"},
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_meeting_should_return_422_for_invalid_meeting_id_format(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_elasticsearch
    ):
        response = client.patch(
            "/meetings/not-a-valid-id",
            headers=auth_headers,
            json={"title": "New Title"},
        )

        assert response.status_code == 422

    def test_update_meeting_should_require_authentication(self, client: TestClient):
        response = client.patch(
            f"/meetings/{VALID_MEETING_ID}", json={"title": "New Title"}
        )

        assert response.status_code == 401
