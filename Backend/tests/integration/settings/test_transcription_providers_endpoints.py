from unittest.mock import patch

from bson import ObjectId
from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from tests.conftest import TEST_USER_ID


class TestTranscriptionProvidersEndpoints:
    def test_get_providers_should_return_whisperx_and_aai(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.find_one.return_value = {
            "_id": ObjectId(TEST_USER_ID),
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "transcription": {
                    "active_provider": "whisperx",
                    "providers": {
                        "aai": {"api_key_encrypted": "encrypted_key_here"},
                        "whisperx": {
                            "model_size": "small",
                            "compute_type": "int8",
                            "device": "cpu",
                        },
                    },
                }
            },
        }

        response = client.get("/settings/transcription/providers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

        whisperx = next(p for p in data if p["name"] == "whisperx")
        assert whisperx["requires_api_key"] is False
        assert whisperx["has_api_key"] is None
        assert whisperx["is_active"] is True

        aai = next(p for p in data if p["name"] == "aai")
        assert aai["requires_api_key"] is True
        assert aai["has_api_key"] is True
        assert aai["is_active"] is False

    def test_set_active_provider_should_succeed_for_whisperx(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.find_one.return_value = {
            "_id": ObjectId(TEST_USER_ID),
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "transcription": {
                    "active_provider": "aai",
                    "providers": {
                        "aai": {"api_key_encrypted": "encrypted_key_here"},
                    },
                }
            },
        }

        response = client.patch(
            "/settings/transcription/active-provider",
            headers=auth_headers,
            json={"provider": "whisperx"},
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "settings.transcription.active_provider" in str(call_args)

    def test_set_active_provider_should_fail_for_aai_without_api_key(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        mock_mongo.find_one.return_value = {
            "_id": ObjectId(TEST_USER_ID),
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "transcription": {
                    "active_provider": "whisperx",
                    "providers": {
                        "aai": {},
                    },
                }
            },
        }

        response = client.patch(
            "/settings/transcription/active-provider",
            headers=auth_headers,
            json={"provider": "aai"},
        )

        assert response.status_code == 400
        assert "requires API key" in response.json()["detail"]

    def test_set_active_provider_should_fail_with_invalid_provider(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        _ = mock_mongo
        response = client.patch(
            "/settings/transcription/active-provider",
            headers=auth_headers,
            json={"provider": "invalid"},
        )

        assert response.status_code == 422

    def test_add_aai_api_key_should_succeed_with_valid_key(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        with patch(
            "app.services.transcription.implementations.assemblyai"
            ".assemblyai_transcription_service.AssemblyaiTranscriptionService"
            ".validate_api_key",
            return_value=None,
        ):
            response = client.post(
                "/settings/transcription/providers/aai/api-key",
                headers=auth_headers,
                json={"api_key": "aai-valid-key"},
            )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "settings.transcription.providers.aai.api_key_encrypted" in str(
            call_args
        )

    def test_add_aai_api_key_should_fail_with_invalid_key(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        with patch(
            "app.services.transcription.implementations.assemblyai"
            ".assemblyai_transcription_service.AssemblyaiTranscriptionService"
            ".validate_api_key",
            side_effect=HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key for aai",
            ),
        ):
            response = client.post(
                "/settings/transcription/providers/aai/api-key",
                headers=auth_headers,
                json={"api_key": "aai-invalid-key"},
            )

        assert response.status_code == 401
        assert "Invalid API key" in response.json()["detail"]
        mock_mongo.update_one.assert_not_called()

    def test_delete_aai_api_key_should_remove_key(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        response = client.delete(
            "/settings/transcription/providers/aai/api-key",
            headers=auth_headers,
        )

        assert response.status_code == 204
        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "$unset" in str(call_args)
        assert "settings.transcription.providers.aai.api_key_encrypted" in str(
            call_args
        )

    def test_transcription_provider_endpoints_should_require_authentication(
        self, client: TestClient, mock_mongo
    ):
        _ = mock_mongo

        response = client.get("/settings/transcription/providers")
        assert response.status_code == 401

        response = client.patch(
            "/settings/transcription/active-provider",
            json={"provider": "whisperx"},
        )
        assert response.status_code == 401

        response = client.post(
            "/settings/transcription/providers/aai/api-key",
            json={"api_key": "aai-key"},
        )
        assert response.status_code == 401

        response = client.delete("/settings/transcription/providers/aai/api-key")
        assert response.status_code == 401
