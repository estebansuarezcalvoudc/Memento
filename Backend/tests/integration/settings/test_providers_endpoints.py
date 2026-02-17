from fastapi.testclient import TestClient


class TestProvidersEndpoints:
    def test_get_providers_should_return_all_available_providers(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that GET /settings/providers returns list of all available providers"""
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.get("/settings/providers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert len(data["providers"]) == 2

        openai = next(p for p in data["providers"] if p["name"] == "OpenAI")
        assert openai["requires_api_key"] is True
        assert openai["has_api_key"] is False
        assert openai["active"] is True

        ollama = next(p for p in data["providers"] if p["name"] == "Ollama")
        assert ollama["requires_api_key"] is False
        assert ollama["has_api_key"] is None
        assert ollama["active"] is True

    def test_get_providers_should_indicate_when_api_key_exists(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that providers with configured API keys show has_api_key=True"""

        def mock_find_one_side_effect(_query, projection=None):
            _ = _query
            if projection and "settings.providers" in str(projection):
                return {
                    "username": "test@example.com",
                    "settings": {
                        "providers": {
                            "OpenAI": {
                                "api_key_encrypted": "encrypted_key_here",
                                "active": True,
                            }
                        }
                    },
                }
            else:
                return {
                    "username": "test@example.com",
                    "password": "$2b$12$test_hashed_password",
                }

        mock_mongo.find_one.side_effect = mock_find_one_side_effect

        response = client.get("/settings/providers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        openai = next(p for p in data["providers"] if p["name"] == "OpenAI")
        assert openai["has_api_key"] is True
        assert openai["active"] is True

    def test_add_provider_api_key_should_succeed_with_valid_key(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_openai
    ):
        """Test that valid OpenAI API key is successfully added and saved"""
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
        assert "settings.providers.OpenAI.active" in str(call_args)

    def test_add_provider_api_key_should_reject_invalid_key_with_401(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_openai
    ):
        """Test that invalid OpenAI API key is rejected with 401"""
        # Arrange
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
        """Test that adding API key to non-existent provider fails with 400"""
        # Arrange
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
        """Test that adding API key to Ollama fails because it doesn't need one"""
        # Arrange
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        response = client.post(
            "/settings/providers/Ollama/api-key",
            headers=auth_headers,
            json={"api_key": "some-key"},
        )

        assert response.status_code == 400
        assert "does not require an API key" in response.json()["detail"]

    def test_delete_provider_api_key_should_remove_key_and_deactivate(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that DELETE removes API key and sets provider to inactive"""
        response = client.delete(
            "/settings/providers/OpenAI/api-key",
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "$unset" in str(call_args)
        assert "api_key_encrypted" in str(call_args)
        assert "active" in str(call_args)

    def test_delete_provider_api_key_should_fail_with_invalid_provider(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that deleting API key from invalid provider fails with 400"""
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        invalid_provider = "InvalidProvider"

        response = client.delete(
            f"/settings/providers/{invalid_provider}/api-key",
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "Invalid provider" in response.json()["detail"]

    def test_update_provider_status_should_activate_provider(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH can activate a provider"""
        response = client.patch(
            "/settings/providers/Ollama/status",
            headers=auth_headers,
            json={"active": True},
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "settings.providers.Ollama.active" in str(call_args)

    def test_update_provider_status_should_deactivate_provider(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH can deactivate a provider"""
        response = client.patch(
            "/settings/providers/OpenAI/status",
            headers=auth_headers,
            json={"active": False},
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()

    def test_update_provider_status_should_fail_with_invalid_provider(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that updating status of invalid provider fails with 400"""
        # Arrange
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        invalid_provider = "InvalidProvider"

        response = client.patch(
            f"/settings/providers/{invalid_provider}/status",
            headers=auth_headers,
            json={"active": True},
        )

        assert response.status_code == 400
        assert "Invalid provider" in response.json()["detail"]

    def test_all_endpoints_should_require_authentication(
        self, client: TestClient, mock_mongo
    ):
        """Test that all settings endpoints return 401 without authentication"""
        # Arrange
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

        response = client.patch(
            "/settings/providers/OpenAI/status",
            json={"active": True},
        )
        assert response.status_code == 401
