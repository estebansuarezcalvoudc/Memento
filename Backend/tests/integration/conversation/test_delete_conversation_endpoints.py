from fastapi.testclient import TestClient

VALID_CONV_ID = "507f1f77bcf86cd799439011"


class TestDeleteConversationEndpoint:
    def test_delete_conversation_should_remove_conversation_and_return_204(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.delete_one.return_value.deleted_count = 1

        response = client.delete(
            f"/conversations/{VALID_CONV_ID}", headers=auth_headers
        )

        assert response.status_code == 204
        mock_mongo.delete_one.assert_called_once()

    def test_delete_conversation_should_return_404_when_conversation_does_not_exist(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.delete_one.return_value.deleted_count = 0

        response = client.delete(
            f"/conversations/{VALID_CONV_ID}", headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_delete_conversation_should_return_422_for_invalid_conversation_id_format(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        response = client.delete("/conversations/not-a-valid-id", headers=auth_headers)

        assert response.status_code == 422

    def test_delete_conversation_should_require_authentication(
        self, client: TestClient
    ):
        response = client.delete(f"/conversations/{VALID_CONV_ID}")

        assert response.status_code == 401
