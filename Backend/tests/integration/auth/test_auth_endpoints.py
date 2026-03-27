from unittest.mock import MagicMock

from bson import ObjectId
from fastapi.testclient import TestClient
from passlib.context import CryptContext
from pymongo.errors import DuplicateKeyError

from tests.conftest import TEST_USER_ID

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_USER_DOC = {
    "_id": ObjectId(TEST_USER_ID),
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
        mock_mongo.insert_one.side_effect = DuplicateKeyError(
            "E11000 duplicate key error"
        )

        request_data = {
            "username": "existing@example.com",
            "password": "securepass123",
        }

        response = client.post("/auth/register", json=request_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
        mock_mongo.insert_one.assert_called_once()

    def test_register_should_initialize_settings_with_ollama_active(
        self, client: TestClient, mock_mongo
    ):
        mock_mongo.find_one.return_value = None  # User doesn't exist
        mock_mongo.insert_one.return_value = MagicMock(inserted_id="test_id")

        response = client.post(
            "/auth/register",
            json={"username": "newuser@example.com", "password": "securepass123"},
        )

        assert response.status_code == 200

        # Find the update_one call that contains $setOnInsert (settings initialization)
        set_on_insert_calls = [
            call
            for call in mock_mongo.update_one.call_args_list
            if "$setOnInsert" in call.args[1]
        ]
        assert (
            len(set_on_insert_calls) == 1
        ), "Expected exactly one $setOnInsert call for settings initialization"

        inserted = set_on_insert_calls[0].args[1]["$setOnInsert"]
        chat_model = inserted["settings"]["models"]["chat_model"]
        transcription = inserted["settings"]["transcription"]

        assert chat_model["provider"] == "Ollama"
        assert chat_model["model_name"] == "llama3.2:latest"
        assert transcription["active_provider"] == "whisperx"
        assert "whisperx" in transcription["providers"]
        assert "aai" in transcription["providers"]

        # Verify upsert=True was passed
        assert set_on_insert_calls[0].kwargs.get("upsert") is True

    def test_register_should_initialize_all_three_models_with_ollama_defaults(
        self, client: TestClient, mock_mongo
    ):
        mock_mongo.find_one.return_value = None
        mock_mongo.insert_one.return_value = MagicMock(inserted_id="test_id")

        client.post(
            "/auth/register",
            json={"username": "newuser@example.com", "password": "securepass123"},
        )

        set_on_insert_calls = [
            call
            for call in mock_mongo.update_one.call_args_list
            if "$setOnInsert" in call.args[1]
        ]
        inserted = set_on_insert_calls[0].args[1]["$setOnInsert"]
        models = inserted["settings"]["models"]

        assert models["chat_model"] == {
            "provider": "Ollama",
            "model_name": "llama3.2:latest",
            "temperature": 0.7,
            "max_tokens": 2000,
        }
        assert models["summary_model"] == {
            "provider": "Ollama",
            "model_name": "llama3.2:latest",
            "temperature": 0.3,
            "max_tokens": 4000,
        }
        assert models["retrieval_model"] == {
            "provider": "Ollama",
            "model_name": "llama3.2:latest",
            "temperature": 0.0,
            "max_tokens": 500,
        }

    def test_register_should_not_initialize_provider_settings(
        self, client: TestClient, mock_mongo
    ):
        mock_mongo.find_one.return_value = None
        mock_mongo.insert_one.return_value = MagicMock(inserted_id="test_id")

        client.post(
            "/auth/register",
            json={"username": "newuser@example.com", "password": "securepass123"},
        )

        set_on_insert_calls = [
            call
            for call in mock_mongo.update_one.call_args_list
            if "$setOnInsert" in call.args[1]
        ]
        inserted = set_on_insert_calls[0].args[1]["$setOnInsert"]

        # providers are derived at read-time from AVAILABLE_PROVIDERS;
        # nothing should be persisted for them at registration
        assert "providers" not in inserted["settings"]

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
            "_id": ObjectId(TEST_USER_ID),
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
            "_id": ObjectId(TEST_USER_ID),
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

    def test_login_should_fail_when_account_is_pending_deletion(
        self, client: TestClient, mock_mongo
    ):
        pending_user_doc = {
            **_USER_DOC,
            "status": "pending_deletion",
            "scheduled_purge_at": None,
        }
        mock_mongo.find_one.return_value = pending_user_doc

        response = client.post(
            "/auth/token",
            data={"username": "test@example.com", "password": "password123"},
        )

        assert response.status_code == 403
        assert "pending deletion" in response.json()["detail"].lower()

    def test_login_should_use_form_data_format(self, client: TestClient, mock_mongo):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "_id": ObjectId(TEST_USER_ID),
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
        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        update_fields = mock_mongo.update_one.call_args.args[1]["$set"]
        assert update_fields["status"] == "pending_deletion"
        assert "scheduled_purge_at" in update_fields
        mock_mongo.delete_many.assert_not_called()
        mock_vector_store.delete.assert_not_called()
        mock_mongo.delete_one.assert_not_called()

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
        mock_mongo.update_one.assert_not_called()
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
        mock_mongo.update_one.assert_not_called()
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

    def test_delete_account_should_not_delete_associated_data_immediately(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_mongo.delete_many.assert_not_called()
        mock_mongo.delete_one.assert_not_called()

    def test_delete_account_should_not_delete_vector_store_embeddings_immediately(
        self, client: TestClient, mock_mongo, auth_headers, mock_vector_store
    ):
        mock_mongo.find_one.side_effect = [_USER_DOC, _USER_DOC]

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_vector_store.delete.assert_not_called()

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
        mock_mongo.update_one.assert_not_called()
        mock_mongo.delete_many.assert_not_called()
        mock_vector_store.delete.assert_not_called()
        mock_mongo.delete_one.assert_not_called()

    def test_delete_account_should_reject_when_already_pending_deletion(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        pending_user_doc = {
            **_USER_DOC,
            "status": "pending_deletion",
            "scheduled_purge_at": None,
        }
        mock_mongo.find_one.side_effect = [_USER_DOC, pending_user_doc]

        response = client.request(
            "DELETE",
            "/auth",
            json={"password": "password123"},
            headers=auth_headers,
        )

        assert response.status_code == 409
        assert "already pending deletion" in response.json()["detail"].lower()
        mock_mongo.update_one.assert_not_called()

    def test_me_should_fail_when_account_is_pending_deletion(
        self, client: TestClient, mock_mongo, auth_headers
    ):
        pending_user_doc = {
            **_USER_DOC,
            "status": "pending_deletion",
            "scheduled_purge_at": None,
        }
        mock_mongo.find_one.return_value = pending_user_doc

        response = client.get("/auth/me", headers=auth_headers)

        assert response.status_code == 403
        assert "pending deletion" in response.json()["detail"].lower()
