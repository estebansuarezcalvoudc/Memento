import json

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

from tests.conftest import TEST_USER_ID

VALID_CONV_ID = "507f1f77bcf86cd799439011"

_USER_DATA = {
    "_id": ObjectId(TEST_USER_ID),
    "username": "test@example.com",
    "password": "$2b$12$test_hashed_password",
}

_REQUEST = {
    "conversation_id": None,
    "message": "Hello, summarize my last meeting",
    "current_datetime": "2024-01-15T10:00:00",
}


def _mongo_side_effect_new_conv(conversation_id: str):
    """
    Returns a find_one side_effect that distinguishes between user queries
    (for JWT auth) and conversation queries (after insert_one creates the conv).
    """

    def side_effect(query, projection=None):
        if query.get("_id") == ObjectId(conversation_id):
            return {"_id": ObjectId(conversation_id), "messages": []}
        return _USER_DATA

    return side_effect


class TestChatWebSocketCreateConversation:
    def test_create_conversation_should_store_conversation_and_stream_reply(
        self,
        client: TestClient,
        auth_headers: dict,
        mock_mongo,
        mock_rag_get_reply_stream,
    ):
        mock_mongo.insert_one.return_value.inserted_id = ObjectId(VALID_CONV_ID)
        mock_mongo.find_one.side_effect = _mongo_side_effect_new_conv(VALID_CONV_ID)
        token = auth_headers["Authorization"].split(" ")[1]

        with client.websocket_connect(f"/conversations/ws?token={token}") as ws:
            ws.send_text(json.dumps(_REQUEST))

            first = json.loads(ws.receive_text())
            assert first["type"] == "conversation_created"
            assert first["conversation_id"] == VALID_CONV_ID
            assert first["title"] == "New chat"

            messages = []
            while True:
                msg = json.loads(ws.receive_text())
                messages.append(msg)
                if msg["type"] in ("done", "error"):
                    break

        assert messages[-1]["type"] == "done"
        mock_mongo.insert_one.assert_called_once()

    def test_create_conversation_should_reject_missing_token(
        self, client: TestClient, mock_mongo
    ):
        with pytest.raises(Exception):
            with client.websocket_connect("/conversations/ws") as ws:
                ws.receive_text()

    def test_create_conversation_should_reject_invalid_token(
        self, client: TestClient, mock_mongo
    ):
        with pytest.raises(Exception):
            with client.websocket_connect(
                "/conversations/ws?token=invalid.token.here"
            ) as ws:
                ws.receive_text()
