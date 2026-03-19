import json
from unittest.mock import AsyncMock, patch

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
    "conversation_id": VALID_CONV_ID,
    "message": "What was discussed in the last meeting?",
    "current_datetime": "2024-01-15T10:00:00+00:00",
}


def _mongo_side_effect(conversation_data):
    def side_effect(query, projection=None):
        if query.get("_id") == ObjectId(VALID_CONV_ID):
            return conversation_data
        return _USER_DATA

    return side_effect


def _find_title_update_call(mock_mongo):
    for call in mock_mongo.update_one.call_args_list:
        update_doc = call[0][1]
        if "$set" in update_doc and update_doc["$set"].get("title"):
            return call
    return None


class TestChatWebSocketSendMessage:
    def test_send_message_should_stream_ai_reply_and_persist_messages(
        self,
        client: TestClient,
        auth_headers: dict,
        mock_mongo,
        mock_rag_get_reply_stream,
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            conversation_data={
                "messages": [{"role": "system", "content": "You are an assistant."}]
            }
        )
        token = auth_headers["Authorization"].split(" ")[1]

        with client.websocket_connect(f"/conversations/ws?token={token}") as ws:
            ws.send_text(json.dumps(_REQUEST))

            first = json.loads(ws.receive_text())
            assert first["type"] == "retrieving"

            messages = []
            while True:
                msg = json.loads(ws.receive_text())
                messages.append(msg)
                if msg["type"] in ("done", "error"):
                    break

        token_msgs = [m for m in messages if m["type"] == "token"]
        assert "".join(m["content"] for m in token_msgs) == "AI response"
        assert messages[-1]["type"] == "done"
        # User message persisted + assistant message persisted
        assert mock_mongo.update_one.call_count == 2

    def test_send_message_should_send_error_when_conversation_does_not_exist(
        self,
        client: TestClient,
        auth_headers: dict,
        mock_mongo,
        mock_rag_get_reply_stream,
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(conversation_data=None)
        token = auth_headers["Authorization"].split(" ")[1]

        with client.websocket_connect(f"/conversations/ws?token={token}") as ws:
            ws.send_text(json.dumps(_REQUEST))
            msg = json.loads(ws.receive_text())
            assert msg["type"] == "error"

    def test_send_message_should_reject_missing_token(
        self, client: TestClient, mock_mongo
    ):
        with pytest.raises(Exception):
            with client.websocket_connect("/conversations/ws") as ws:
                ws.receive_text()

    def test_send_message_should_send_error_on_invalid_json(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        token = auth_headers["Authorization"].split(" ")[1]

        with client.websocket_connect(f"/conversations/ws?token={token}") as ws:
            ws.send_text("this is not valid json")
            msg = json.loads(ws.receive_text())
            assert msg["type"] == "error"

    def test_send_message_should_send_error_on_missing_message_field(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        token = auth_headers["Authorization"].split(" ")[1]
        bad_request = {
            "conversation_id": VALID_CONV_ID,
            "current_datetime": "2024-01-15T10:00:00+00:00",
        }

        with client.websocket_connect(f"/conversations/ws?token={token}") as ws:
            ws.send_text(json.dumps(bad_request))
            msg = json.loads(ws.receive_text())
            assert msg["type"] == "error"

    def test_send_message_should_emit_title_event_and_persist_generated_title_on_first_message(
        self,
        client: TestClient,
        auth_headers: dict,
        mock_mongo,
        mock_rag_get_reply_stream,
    ):
        mock_mongo.find_one.side_effect = _mongo_side_effect(
            conversation_data={"messages": []}
        )
        token = auth_headers["Authorization"].split(" ")[1]

        with patch(
            "app.services.conversation.rag.Rag.generate_title",
            new_callable=AsyncMock,
            return_value="First message title",
        ):
            with client.websocket_connect(f"/conversations/ws?token={token}") as ws:
                ws.send_text(json.dumps(_REQUEST))

                first = json.loads(ws.receive_text())
                assert first["type"] == "retrieving"

                messages = []
                while True:
                    msg = json.loads(ws.receive_text())
                    messages.append(msg)
                    if msg["type"] in ("done", "error"):
                        break

        event_types = [m["type"] for m in messages]
        assert "title" in event_types
        assert event_types.index("title") < event_types.index("done")

        title_events = [m for m in messages if m["type"] == "title"]
        assert title_events[-1]["title"] == "First message title"

        title_update_call = _find_title_update_call(mock_mongo)
        assert title_update_call is not None
        assert title_update_call[0][1]["$set"]["title"] == "First message title"
