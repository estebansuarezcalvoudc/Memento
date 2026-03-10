from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient


class TestModelsEndpoints:
    def test_get_available_models_should_return_models_from_active_providers(
        self, client: TestClient, auth_headers: dict, mock_mongo, mock_openai
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup

        def mongo_side_effect(query, projection=None):
            _ = query
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
            "app.services.settings.models_service.list_models"
        ) as mock_list_models:
            mock_list_models.return_value = ["gpt-4o", "gpt-3.5-turbo"]

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

        with patch(
            "app.services.settings.models_service.list_models"
        ) as mock_list_models:
            mock_list_models.return_value = []

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

    def test_get_retrieval_model_should_return_user_configuration(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "models": {
                    "retrieval_model": {
                        "provider": "Ollama",
                        "model_name": "llama3.1",
                        "temperature": 0.5,
                        "max_tokens": 1500,
                    },
                }
            },
        }

        response = client.get("/settings/models/retrieval", headers=auth_headers)

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
        assert (
            client.get("/settings/models/summary", headers=auth_headers).json() is None
        )
        assert (
            client.get("/settings/models/retrieval", headers=auth_headers).json()
            is None
        )

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

    def test_update_retrieval_model_should_save_configuration(
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
            "/settings/models/retrieval",
            headers=auth_headers,
            json=request_data,
        )

        assert response.status_code == 200
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "settings.models.retrieval_model" in call_args[0][1]["$set"]

    def test_update_retrieval_model_should_return_saved_configuration(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        request_data = {
            "provider": "OpenAI",
            "model_name": "gpt-4o-mini",
            "temperature": 0.2,
            "max_tokens": 1000,
        }

        response = client.put(
            "/settings/models/retrieval",
            headers=auth_headers,
            json=request_data,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == request_data["provider"]
        assert data["model_name"] == request_data["model_name"]
        assert data["temperature"] == request_data["temperature"]
        assert data["max_tokens"] == request_data["max_tokens"]

    def test_get_chat_model_should_return_ollama_defaults_when_initialized_at_registration(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        # Simulate the exact document produced by initialize_user_settings
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "providers": {
                    "Ollama": {"active": True},
                    "OpenAI": {"active": False},
                },
                "models": {
                    "chat_model": {
                        "provider": "Ollama",
                        "model_name": "llama3.2:latest",
                        "temperature": 0.7,
                        "max_tokens": 2000,
                    }
                },
            },
        }

        response = client.get("/settings/models/chat", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "Ollama"
        assert data["model_name"] == "llama3.2:latest"
        assert data["temperature"] == 0.7
        assert data["max_tokens"] == 2000

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

        response = client.get("/settings/models/retrieval")
        assert response.status_code == 401

        response = client.put(
            "/settings/models/retrieval",
            json={
                "provider": "OpenAI",
                "model_name": "gpt-4o",
                "temperature": 0.7,
                "max_tokens": 2000,
            },
        )
        assert response.status_code == 401


class TestPullModelEndpoint:
    def test_pull_model_should_return_201_when_pulling_ollama_model(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup

        with patch("app.services.settings.models_service.ollama") as mock_ollama:
            mock_ollama.pull.return_value = None

            response = client.post(
                "/settings/models/pull",
                headers=auth_headers,
                json={"provider": "Ollama", "model": "llama3.2:latest"},
            )

        assert response.status_code == 201
        mock_ollama.pull.assert_called_once_with("llama3.2:latest")

    def test_pull_model_should_return_400_when_provider_does_not_support_pull(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup

        with patch("app.services.settings.models_service.ollama") as mock_ollama:
            response = client.post(
                "/settings/models/pull",
                headers=auth_headers,
                json={"provider": "OpenAI", "model": "gpt-4o"},
            )

            mock_ollama.pull.assert_not_called()

        assert response.status_code == 400
        assert "OpenAI" in response.json()["detail"]
        assert "cannot pull models" in response.json()["detail"]

    def test_pull_model_should_return_500_when_ollama_raises_unexpected_error(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup

        with patch("app.services.settings.models_service.ollama") as mock_ollama:
            mock_ollama.pull.side_effect = Exception("Connection refused")

            response = client.post(
                "/settings/models/pull",
                headers=auth_headers,
                json={"provider": "Ollama", "model": "llama3.2:latest"},
            )

        assert response.status_code == 500
        assert response.json()["detail"] == "Internal server error while pulling model"

    def test_pull_model_should_require_authentication(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo  # Fixture needed for MongoDB mock setup

        response = client.post(
            "/settings/models/pull",
            json={"provider": "Ollama", "model": "llama3.2:latest"},
        )

        assert response.status_code == 401
