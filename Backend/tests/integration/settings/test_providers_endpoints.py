from bson import ObjectId
from fastapi.testclient import TestClient

from tests.conftest import TEST_USER_ID


class TestProvidersEndpoints:
    def test_get_providers_should_return_all_available_providers(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.find_one.return_value = {
            "_id": ObjectId(TEST_USER_ID),
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.get("/settings/providers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3

        openai = next(p for p in data if p["name"] == "OpenAI")
        assert openai["requires_api_key"] is True
        assert openai["has_api_key"] is False

        ollama = next(p for p in data if p["name"] == "Ollama")
        assert ollama["requires_api_key"] is False
        assert ollama["has_api_key"] is None

        anthropic = next(p for p in data if p["name"] == "Anthropic")
        assert anthropic["requires_api_key"] is True
        assert anthropic["has_api_key"] is False

    def test_get_providers_should_indicate_when_api_key_exists(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):

        def mock_find_one_side_effect(_query, projection=None):
            _ = _query
            if projection and "settings.providers" in str(projection):
                return {
                    "_id": ObjectId(TEST_USER_ID),
                    "username": "test@example.com",
                    "settings": {
                        "providers": {
                            "OpenAI": {
                                "api_key_encrypted": "encrypted_key_here",
                            }
                        }
                    },
                }
            else:
                return {
                    "_id": ObjectId(TEST_USER_ID),
                    "username": "test@example.com",
                    "password": "$2b$12$test_hashed_password",
                }

        mock_mongo.find_one.side_effect = mock_find_one_side_effect

        response = client.get("/settings/providers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        openai = next(p for p in data if p["name"] == "OpenAI")
        assert openai["has_api_key"] is True

    def test_get_providers_should_return_no_api_key_for_openai_without_key(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        def mock_find_one_side_effect(_query, projection=None):
            _ = _query
            if projection and "settings.providers" in str(projection):
                return {
                    "_id": ObjectId(TEST_USER_ID),
                    "username": "test@example.com",
                    "settings": {
                        "providers": {
                            "OpenAI": {},
                        }
                    },
                }
            else:
                return {
                    "_id": ObjectId(TEST_USER_ID),
                    "username": "test@example.com",
                    "password": "$2b$12$test_hashed_password",
                }

        mock_mongo.find_one.side_effect = mock_find_one_side_effect

        response = client.get("/settings/providers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        openai = next(p for p in data if p["name"] == "OpenAI")
        assert openai["has_api_key"] is False

    def test_add_provider_api_key_should_succeed_with_valid_key(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_openai
    ):
        mock_openai.models.list.return_value = ["gpt-4", "gpt-3.5-turbo"]

        response = client.post(
            "/settings/providers/OpenAI/api-key",
            headers=auth_headers,
            json={"api_key": "sk-test-valid-key"},
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "settings.providers.OpenAI.api_key_encrypted" in str(call_args)

    def test_add_provider_api_key_should_reject_invalid_key_with_401(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_openai
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_openai.models.list.side_effect = Exception("Invalid API key")

        response = client.post(
            "/settings/providers/OpenAI/api-key",
            headers=auth_headers,
            json={"api_key": "sk-invalid-key"},
        )

        assert response.status_code == 401
        assert "Invalid API key" in response.json()["detail"]
        mock_mongo.update_one.assert_not_called()

    def test_add_provider_api_key_should_fail_with_invalid_provider(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        invalid_provider = "InvalidProvider"

        response = client.post(
            f"/settings/providers/{invalid_provider}/api-key",
            headers=auth_headers,
            json={"api_key": "some-key"},
        )

        assert response.status_code == 400
        assert "Invalid provider" in response.json()["detail"]

    def test_add_provider_api_key_should_fail_for_ollama(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        response = client.post(
            "/settings/providers/Ollama/api-key",
            headers=auth_headers,
            json={"api_key": "some-key"},
        )

        assert response.status_code == 400
        assert "does not require an API key" in response.json()["detail"]

    def test_delete_provider_api_key_should_remove_key(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        # _apply_ollama_fallback will call find_one for each model getter
        # Return a doc with no models so the fallback skips the update
        mock_mongo.find_one.return_value = {
            "_id": ObjectId(TEST_USER_ID),
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.delete(
            "/settings/providers/OpenAI/api-key",
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "$unset" in str(call_args)
        assert "api_key_encrypted" in str(call_args)

    def test_delete_provider_api_key_should_fail_with_invalid_provider(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        invalid_provider = "InvalidProvider"

        response = client.delete(
            f"/settings/providers/{invalid_provider}/api-key",
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "Invalid provider" in response.json()["detail"]

    def test_all_endpoints_should_require_authentication(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        response = client.get("/settings/providers")
        assert response.status_code == 401

        response = client.post(
            "/settings/providers/OpenAI/api-key",
            json={"api_key": "sk-test"},
        )
        assert response.status_code == 401

        response = client.delete("/settings/providers/OpenAI/api-key")
        assert response.status_code == 401
