from datetime import datetime

from bson import ObjectId
from fastapi.testclient import TestClient

VALID_CONV_ID = "507f1f77bcf86cd799439011"

_USER_DATA = {"username": "test@example.com", "password": "$2b$12$test_hashed_password"}


def _mongo_side_effect(conversation_data):
    def side_effect(query, projection=None):
        if "_id" in query:
            return conversation_data
        return _USER_DATA

    return side_effect


class TestRetrieveAllConversationsEndpoint:
    def test_retrieve_all_conversations_should_return_list_of_user_conversations(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.find.return_value = [
            {
                "_id": ObjectId(VALID_CONV_ID),
                "title": "New chat",
                "started_at": datetime(2024, 1, 15, 10, 0, 0),
            }
        ]

        response = client.get("/conversations", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == VALID_CONV_ID
        assert data[0]["title"] == "New chat"
        mock_mongo.find.assert_called_once()

    def test_retrieve_all_conversations_should_return_empty_list_when_user_has_no_conversations(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.find.return_value = []

        response = client.get("/conversations", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == []

    def test_retrieve_all_conversations_should_require_authentication(
        self, client: TestClient
    ):
        response = client.get("/conversations")

        assert response.status_code == 401


class TestRetrieveDialogueEndpoint:
    def test_retrieve_dialogue_should_return_only_user_and_assistant_messages(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            conversation_data={
                "messages": [
                    {"role": "system", "content": "You are an assistant."},
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi! How can I help?"},
                    {
                        "role": "assistant",
                        "content": None,
                        "tool_calls": [{"id": "call_1"}],
                    },
                ]
            }
        )

        response = client.get(f"/conversations/{VALID_CONV_ID}", headers=auth_headers)

        assert response.status_code == 200
        messages = response.json()
        assert len(messages) == 2
        assert messages[0] == {"role": "user", "content": "Hello"}
        assert messages[1] == {"role": "assistant", "content": "Hi! How can I help?"}

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
