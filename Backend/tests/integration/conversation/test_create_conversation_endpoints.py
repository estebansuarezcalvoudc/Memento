from unittest.mock import patch

from bson import ObjectId
from fastapi.testclient import TestClient

VALID_CONV_ID = "507f1f77bcf86cd799439011"

_PATCH_CREATE_TASK = (
    "app.services.conversation.conversation_service.asyncio.create_task"
)

_REQUEST = {
    "message": "Hello, summarize my last meeting",
    "language_model_configuration": {"provider": "OpenAI", "model": "gpt-4o-mini"},
}


def _closing_create_task(coro):
    """Close the coroutine immediately so it does not generate an unawaited warning."""
    coro.close()


class TestCreateConversationEndpoint:
    def test_create_conversation_should_store_conversation_and_return_200(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_mcp_client
    ):
        mock_mongo.insert_one.return_value.inserted_id = ObjectId(VALID_CONV_ID)

        with patch(_PATCH_CREATE_TASK, side_effect=_closing_create_task):
            response = client.post(
                "/conversations", headers=auth_headers, json=_REQUEST
            )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == VALID_CONV_ID
        assert data["title"] == "New chat"
        assert "started_at" in data
        mock_mongo.insert_one.assert_called_once()

    def test_create_conversation_should_schedule_initial_message_as_background_task(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_mcp_client
    ):
        mock_mongo.insert_one.return_value.inserted_id = ObjectId(VALID_CONV_ID)

        with patch(
            _PATCH_CREATE_TASK, side_effect=_closing_create_task
        ) as mock_create_task:
            client.post("/conversations", headers=auth_headers, json=_REQUEST)

        mock_create_task.assert_called_once()

    def test_create_conversation_should_require_authentication(
        self, client: TestClient
    ):
        response = client.post("/conversations", json=_REQUEST)

        assert response.status_code == 401

    def test_create_conversation_should_validate_required_message_field(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        response = client.post("/conversations", headers=auth_headers, json={})

        assert response.status_code == 422
