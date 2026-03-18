from datetime import datetime
from unittest.mock import MagicMock

from bson import ObjectId
from fastapi.testclient import TestClient

from tests.conftest import TEST_USER_ID

VALID_CONV_ID = "507f1f77bcf86cd799439011"

_USER_DATA = {
    "_id": ObjectId(TEST_USER_ID),
    "username": "test@example.com",
    "password": "$2b$12$test_hashed_password",
}


def _mongo_side_effect(conversation_data):
    def side_effect(query, projection=None):
        if query.get("_id") == ObjectId(VALID_CONV_ID):
            return conversation_data
        return _USER_DATA

    return side_effect


class TestRetrieveAllConversationsEndpoint:
    def test_retrieve_all_conversations_should_return_list_of_user_conversations(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        cursor = MagicMock()
        cursor.sort.return_value = [
            {
                "_id": ObjectId(VALID_CONV_ID),
                "title": "New chat",
                "updated_at": datetime(2024, 1, 15, 10, 0, 0),
            }
        ]
        mock_mongo.find.return_value = cursor

        response = client.get("/conversations", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == VALID_CONV_ID
        assert data[0]["title"] == "New chat"
        mock_mongo.find.assert_called_once()

    def test_retrieve_all_conversations_should_sort_by_updated_at_desc(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        cursor = MagicMock()
        cursor.sort.return_value = []
        mock_mongo.find.return_value = cursor

        response = client.get("/conversations", headers=auth_headers)

        assert response.status_code == 200
        cursor.sort.assert_called_once_with([("updated_at", -1), ("_id", -1)])

    def test_retrieve_all_conversations_should_return_empty_list_when_user_has_no_conversations(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        cursor = MagicMock()
        cursor.sort.return_value = []
        mock_mongo.find.return_value = cursor

        response = client.get("/conversations", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == []

    def test_retrieve_all_conversations_should_require_authentication(
        self, client: TestClient
    ):
        response = client.get("/conversations")

        assert response.status_code == 401


class TestRetrieveDialogueEndpoint:
    def test_retrieve_dialogue_should_return_all_messages(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        stored_messages = [
            {"role": "system", "content": "You are an assistant."},
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi! How can I help?"},
            {
                "role": "assistant",
                "content": None,
                "tool_calls": [{"id": "call_1"}],
            },
        ]
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            conversation_data={"messages": stored_messages}
        )

        response = client.get(f"/conversations/{VALID_CONV_ID}", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == stored_messages

    def test_retrieve_dialogue_should_return_404_when_conversation_does_not_exist(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(conversation_data=None)

        response = client.get(f"/conversations/{VALID_CONV_ID}", headers=auth_headers)

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_retrieve_dialogue_should_return_422_for_invalid_conversation_id_format(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        response = client.get("/conversations/not-a-valid-id", headers=auth_headers)

        assert response.status_code == 422

    def test_retrieve_dialogue_should_require_authentication(self, client: TestClient):
        response = client.get(f"/conversations/{VALID_CONV_ID}")

        assert response.status_code == 401
