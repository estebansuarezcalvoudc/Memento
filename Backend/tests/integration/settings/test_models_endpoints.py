from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient


class TestModelsEndpoints:
    def test_get_available_models_should_return_models_from_active_providers(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_openai
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup

        def mongo_side_effect(query, projection=None):
            if "password" in str(projection):
                return {
                    "username": "test@example.com",
                    "password": "$2b$12$test_hashed_password",
                }

            return {
                "username": "test@example.com",
                "password": "$2b$12$test_hashed_password",
                "settings": {
                    "providers": {
                        "OpenAI": {
                            "api_key_encrypted": "encrypted_key",
                            "active": True,
                        },
                    }
                },
            }

        mock_mongo.find_one.side_effect = mongo_side_effect

        mock_model_1 = MagicMock()
        mock_model_1.id = "gpt-4o"
        mock_model_2 = MagicMock()
        mock_model_2.id = "gpt-3.5-turbo"
        mock_openai.models.list.return_value = MagicMock(
            data=[mock_model_1, mock_model_2]
        )

        with patch(
            "app.services.settings.models_service.create_openai_client"
        ) as mock_create_client:
            mock_create_client.return_value = mock_openai

            response = client.get("/settings/models/available", headers=auth_headers)

            assert response.status_code == 200
            models = response.json()
            assert isinstance(models, list)
            assert len(models) >= 2  # At least 2 models (OpenAI)
            assert any(
                m["id"] == "gpt-4o" and m["provider"] == "OpenAI" for m in models
            )

    def test_get_available_models_should_return_empty_when_no_active_providers(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "providers": {
                    "OpenAI": {"api_key_encrypted": "encrypted_key", "active": False},
                }
            },
        }

        response = client.get("/settings/models/available", headers=auth_headers)

        assert response.status_code == 200
        models = response.json()
        assert isinstance(models, list)
        assert len(models) == 0

    def test_get_chat_model_should_return_user_configuration(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "models": {
                    "chat_model": {
                        "provider": "OpenAI",
                        "model_name": "gpt-4o",
                        "temperature": 0.7,
                        "max_tokens": 2000,
                    },
                }
            },
        }

        response = client.get("/settings/models/chat", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "OpenAI"
        assert data["model_name"] == "gpt-4o"

    def test_get_summary_model_should_return_user_configuration(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "models": {
                    "summary_model": {
                        "provider": "Ollama",
                        "model_name": "llama3.1",
                        "temperature": 0.5,
                        "max_tokens": 1500,
                    },
                }
            },
        }

        response = client.get("/settings/models/summary", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "Ollama"
        assert data["model_name"] == "llama3.1"

    def test_get_model_should_return_null_when_no_configuration(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        assert client.get("/settings/models/chat", headers=auth_headers).json() is None
        assert client.get("/settings/models/summary", headers=auth_headers).json() is None

    def test_update_chat_model_should_save_configuration(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        request_data = {
            "provider": "OpenAI",
            "model_name": "gpt-4o",
            "temperature": 0.8,
            "max_tokens": 3000,
        }

        response = client.put(
            "/settings/models/chat",
            headers=auth_headers,
            json=request_data,
        )

        assert response.status_code == 200
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "settings.models.chat_model" in call_args[0][1]["$set"]

    def test_update_summary_model_should_save_configuration(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        request_data = {
            "provider": "Ollama",
            "model_name": "llama3.1",
            "temperature": 0.5,
            "max_tokens": 1500,
        }

        response = client.put(
            "/settings/models/summary",
            headers=auth_headers,
            json=request_data,
        )

        assert response.status_code == 200
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "settings.models.summary_model" in call_args[0][1]["$set"]

    def test_models_endpoints_should_require_authentication(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup

        response = client.get("/settings/models/available")
        assert response.status_code == 401

        response = client.get("/settings/models/chat")
        assert response.status_code == 401

        response = client.get("/settings/models/summary")
        assert response.status_code == 401

        response = client.put(
            "/settings/models/chat",
            json={
                "provider": "OpenAI",
                "model_name": "gpt-4o",
                "temperature": 0.7,
                "max_tokens": 2000,
            },
        )
        assert response.status_code == 401

        response = client.put(
            "/settings/models/summary",
            json={
                "provider": "OpenAI",
                "model_name": "gpt-4o",
                "temperature": 0.7,
                "max_tokens": 2000,
            },
        )
        assert response.status_code == 401
