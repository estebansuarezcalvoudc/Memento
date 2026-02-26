from bson import ObjectId
from fastapi.testclient import TestClient

VALID_CONV_ID = "507f1f77bcf86cd799439011"

_USER_DATA = {"username": "test@example.com", "password": "$2b$12$test_hashed_password"}

_REQUEST = {
    "message": "What was discussed in the last meeting?",
    "language_model_configuration": {"provider": "OpenAI", "model": "gpt-4o-mini"},
    "current_datetime": "2024-01-15T10:00:00",
}


def _mongo_side_effect(conversation_data):
    def side_effect(query, projection=None):
        if "_id" in query:
            return conversation_data
        return _USER_DATA

    return side_effect


class TestSendMessageEndpoint:
    def test_send_message_should_return_ai_reply_and_persist_messages(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_rag_get_reply
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            conversation_data={
                "messages": [{"role": "system", "content": "You are an assistant."}]
            }
        )

        response = client.post(
            f"/conversations/{VALID_CONV_ID}/chat",
            headers=auth_headers,
            json=_REQUEST,
        )

        assert response.status_code == 200
        assert response.json() == "AI response"
        mock_rag_get_reply.assert_awaited_once()
        mock_mongo.update_one.assert_called_once()

    def test_send_message_should_return_404_when_conversation_does_not_exist(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_rag_get_reply
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(conversation_data=None)

        response = client.post(
            f"/conversations/{VALID_CONV_ID}/chat",
            headers=auth_headers,
            json=_REQUEST,
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_send_message_should_return_422_for_invalid_conversation_id_format(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_rag_get_reply
    ):
        response = client.post(
            "/conversations/not-a-valid-id/chat",
            headers=auth_headers,
            json=_REQUEST,
        )

        assert response.status_code == 422

    def test_send_message_should_require_authentication(self, client: TestClient):
        response = client.post(
            f"/conversations/{VALID_CONV_ID}/chat", json=_REQUEST
        )

        assert response.status_code == 401

    def test_send_message_should_validate_required_message_field(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_rag_get_reply
    ):
        response = client.post(
            f"/conversations/{VALID_CONV_ID}/chat",
            headers=auth_headers,
            json={},
        )

        assert response.status_code == 422
