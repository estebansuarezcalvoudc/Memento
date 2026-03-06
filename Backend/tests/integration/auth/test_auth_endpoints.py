from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_USER_DOC = {
    "username": "test@example.com",
    "password": pwd_context.hash("password123"),
}


class TestAuthEndpoints:
    def test_register_should_create_user_and_return_token(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = None  # User doesn't exist
        mock_mongo.insert_one.return_value = MagicMock(inserted_id="test_id")

        request_data = {"username": "newuser@example.com", "password": "securepass123"}

        response = client.post("/auth/register", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        mock_mongo.insert_one.assert_called_once()

    def test_register_should_fail_when_user_already_exists(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "existing@example.com",
            "password": pwd_context.hash("password123"),
        }

        request_data = {
            "username": "existing@example.com",
            "password": "securepass123",
        }

        response = client.post("/auth/register", json=request_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
        mock_mongo.insert_one.assert_not_called()

    def test_register_should_validate_required_fields(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        response = client.post("/auth/register", json={})

        assert response.status_code == 422  # Unprocessable Entity

        response = client.post("/auth/register", json={"username": "test@example.com"})
        assert response.status_code == 422

        response = client.post("/auth/register", json={"password": "securepass123"})
        assert response.status_code == 422

    def test_login_should_return_token_with_valid_credentials(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": pwd_context.hash("password123"),
        }

        response = client.post(
            "/auth/token",
            data={"username": "test@example.com", "password": "password123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_should_fail_with_invalid_password(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": pwd_context.hash("password123"),
        }

        response = client.post(
            "/auth/token",
            data={"username": "test@example.com", "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert "incorrect username or password" in response.json()["detail"].lower()

    def test_login_should_fail_with_nonexistent_user(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = None

        response = client.post(
            "/auth/token",
            data={"username": "nonexistent@example.com", "password": "password123"},
        )

        assert response.status_code == 401
        assert "incorrect username or password" in response.json()["detail"].lower()

    def test_login_should_use_form_data_format(self, client: TestClient, mock_mongo):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": pwd_context.hash("password123"),
        }

        # Should work with form data
        response = client.post(
            "/auth/token",
            data={"username": "test@example.com", "password": "password123"},
        )
        assert response.status_code == 200

        # Should fail with JSON
        response = client.post(
            "/auth/token",
            json={"username": "test@example.com", "password": "password123"},
        )
        assert response.status_code == 422

    def test_login_should_validate_required_fields(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        response = client.post("/auth/token", data={})
        assert response.status_code == 422

        response = client.post("/auth/token", data={"username": "test@example.com"})
        assert response.status_code == 422

        response = client.post("/auth/token", data={"password": "password123"})
        assert response.status_code == 422

    # --- change username ---

    def test_change_username_should_return_new_token(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # 1st call: auth middleware retrieves current user
        # 2nd call: service retrieves current user to verify password
        # 3rd call: service checks new username is not taken
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC, None]
        mock_mongo.update_one.return_value = MagicMock(matched_count=1)

        response = client.patch(
            "/auth/username",
            json={"new_username": "newname@example.com", "password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        mock_mongo.update_one.assert_called_once()

    def test_change_username_should_fail_when_new_username_is_taken(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # 1st call: auth middleware retrieves current user
        # 2nd call: service retrieves current user to verify password
        # 3rd call: service finds new username already exists
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC, _USER_DOC]

        response = client.patch(
            "/auth/username",
            json={"new_username": "taken@example.com", "password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
        mock_mongo.update_one.assert_not_called()

    def test_change_username_should_fail_when_user_not_found_in_db(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # 1st call: auth middleware retrieves current user
        # 2nd call: service retrieves current user to verify password
        # 3rd call: new username is free
        # update_one: matched_count=0 means the document was deleted between calls
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC, None]
        mock_mongo.update_one.return_value = MagicMock(matched_count=0)

        response = client.patch(
            "/auth/username",
            json={"new_username": "newname@example.com", "password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_change_username_should_require_authentication(self, client: TestClient):
        response = client.patch(
            "/auth/username", json={"new_username": "newname@example.com"}
        )
        assert response.status_code == 401

    def test_change_username_should_validate_required_fields(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        mock_mongo.find_one.return_value = _USER_DOC

        response = client.patch("/auth/username", json={}, headers=auth_headers)
        assert response.status_code == 422

    # --- change password ---

    def test_change_password_should_succeed_with_correct_current_password(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # 1st call: auth middleware; 2nd call: service verifies current password
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]
        mock_mongo.update_one.return_value = MagicMock(matched_count=1)

        response = client.patch(
            "/auth/password",
            json={"current_password": "password123", "new_password": "newpass456"},
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()

    def test_change_password_should_fail_with_wrong_current_password(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]

        response = client.patch(
            "/auth/password",
            json={"current_password": "wrongpassword", "new_password": "newpass456"},
            headers=auth_headers,
        )

        assert response.status_code == 401
        assert "incorrect password" in response.json()["detail"].lower()
        mock_mongo.update_one.assert_not_called()

    def test_change_password_should_fail_when_user_not_found_in_db(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # Auth middleware ok, but service finds no user (deleted between calls)
        mock_mongo.find_one.side_effect = [_USER_DOC, None]

        response = client.patch(
            "/auth/password",
            json={"current_password": "password123", "new_password": "newpass456"},
            headers=auth_headers,
        )

        assert response.status_code == 401

    def test_change_password_should_require_authentication(self, client: TestClient):
        response = client.patch(
            "/auth/password",
            json={"current_password": "password123", "new_password": "newpass456"},
        )
        assert response.status_code == 401

    def test_change_password_should_validate_required_fields(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        mock_mongo.find_one.return_value = _USER_DOC

        response = client.patch("/auth/password", json={}, headers=auth_headers)
        assert response.status_code == 422

        response = client.patch(
            "/auth/password",
            json={"current_password": "password123"},
            headers=auth_headers,
        )
        assert response.status_code == 422

        response = client.patch(
            "/auth/password",
            json={"new_password": "newpass456"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    # --- delete account ---

    def test_delete_account_should_succeed_with_correct_password(
        self, client: TestClient, mock_mongo, auth_headers, mock_vector_store
    ):
        # 1st call: auth middleware retrieves current user
        # 2nd call: service retrieves current user to verify password
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]
        mock_mongo.delete_one.return_value = MagicMock(deleted_count=1)

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_mongo.delete_many.assert_called()
        mock_vector_store.delete.assert_called_once_with(
            where={"username": "test@example.com"}
        )
        mock_mongo.delete_one.assert_called_once()

    def test_delete_account_should_fail_with_wrong_password(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # 1st call: auth middleware; 2nd call: service verifies password
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "wrongpassword"},
            headers=auth_headers,
        )

        assert response.status_code == 401
        assert "incorrect password" in response.json()["detail"].lower()
        mock_mongo.delete_one.assert_not_called()

    def test_delete_account_should_fail_when_user_not_found_in_db(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # Auth middleware ok, but service finds no user (deleted between calls)
        mock_mongo.find_one.side_effect = [_USER_DOC, None]

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 401
        mock_mongo.delete_one.assert_not_called()

    def test_delete_account_should_require_authentication(self, client: TestClient):
        response = client.request("DELETE", "/auth", json={"password": "password123"})
        assert response.status_code == 401

    def test_delete_account_should_validate_required_fields(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        mock_mongo.find_one.return_value = _USER_DOC

        response = client.request("DELETE", "/auth", json={}, headers=auth_headers)
        assert response.status_code == 422

    def test_delete_account_should_delete_all_associated_data(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # Verifies that delete_many is called exactly 3 times:
        # once for meetings, once for conversations, once for settings
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]
        mock_mongo.delete_one.return_value = MagicMock(deleted_count=1)

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 204
        assert mock_mongo.delete_many.call_count == 3
        for call in mock_mongo.delete_many.call_args_list:
            assert call.args == ({"username": "test@example.com"},)
        mock_mongo.delete_one.assert_called_once_with({"username": "test@example.com"})

    def test_delete_account_should_delete_vector_store_embeddings(
        self, client: TestClient, mock_mongo, auth_headers, mock_vector_store
    ):
        # Verifies that the vector store embeddings for the user are deleted
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]
        mock_mongo.delete_one.return_value = MagicMock(deleted_count=1)

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_vector_store.delete.assert_called_once_with(
            where={"username": "test@example.com"}
        )

    def test_delete_account_should_not_delete_any_data_with_wrong_password(
        self, client: TestClient, mock_mongo, auth_headers, mock_vector_store
    ):
        # Verifies that no data is deleted at all when password verification fails,
        # ensuring there is no partial deletion
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "wrongpassword"},
            headers=auth_headers,
        )

        assert response.status_code == 401
        mock_mongo.delete_many.assert_not_called()
        mock_vector_store.delete.assert_not_called()
        mock_mongo.delete_one.assert_not_called()

    def test_delete_account_should_delete_auth_record_last(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        # Verifies that the auth record (delete_one) is only deleted after all
        # associated data (delete_many x3) has been removed
        call_order = []
        mock_mongo.delete_many.side_effect = lambda *a, **kw: call_order.append(
            "delete_many"
        )
        mock_mongo.delete_one.side_effect = lambda *a, **kw: (
            call_order.append("delete_one"),
            MagicMock(deleted_count=1),
        )[1]
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 204
        assert call_order.count("delete_many") == 3
        assert call_order.count("delete_one") == 1
        assert call_order[-1] == "delete_one"
