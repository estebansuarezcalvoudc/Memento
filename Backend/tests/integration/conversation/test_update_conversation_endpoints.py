from fastapi.testclient import TestClient

VALID_CONV_ID = "507f1f77bcf86cd799439011"


class TestUpdateConversationEndpoint:
    def test_update_conversation_should_persist_new_title_and_return_204(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.update_one.return_value.modified_count = 1

        response = client.put(
            f"/conversations/{VALID_CONV_ID}",
            headers=auth_headers,
            json={"title": "Updated title"},
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert call_args[0][1]["$set"]["title"] == "Updated title"

    def test_update_conversation_should_return_404_when_conversation_does_not_exist(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.update_one.return_value.modified_count = 0

        response = client.put(
            f"/conversations/{VALID_CONV_ID}",
            headers=auth_headers,
            json={"title": "Updated title"},
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_conversation_should_return_422_for_invalid_conversation_id_format(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        response = client.put(
            "/conversations/not-a-valid-id",
            headers=auth_headers,
            json={"title": "Updated title"},
        )

        assert response.status_code == 422

    def test_update_conversation_should_validate_required_title_field(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        response = client.put(
            f"/conversations/{VALID_CONV_ID}",
            headers=auth_headers,
            json={},
        )

        assert response.status_code == 422

    def test_update_conversation_should_require_authentication(
        self, client: TestClient
    ):
        response = client.put(
            f"/conversations/{VALID_CONV_ID}", json={"title": "Updated title"}
        )

        assert response.status_code == 401
