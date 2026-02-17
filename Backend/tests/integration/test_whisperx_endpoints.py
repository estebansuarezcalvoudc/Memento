from fastapi.testclient import TestClient


class TestWhisperXEndpoints:
    def test_get_available_options_should_return_models_and_compute_types(
        self, client: TestClient
    ):
        """Test that GET /settings/transcription/whisperx/available-options returns models and compute types"""
        response = client.get("/settings/transcription/whisperx/available-options")

        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert "compute_types" in data

        assert isinstance(data["models"], list)
        assert len(data["models"]) == 7
        assert "tiny" in data["models"]
        assert "base" in data["models"]
        assert "small" in data["models"]
        assert "medium" in data["models"]
        assert "large" in data["models"]
        assert "large-v2" in data["models"]
        assert "large-v3" in data["models"]

        assert isinstance(data["compute_types"], list)
        assert len(data["compute_types"]) == 3
        assert "int8" in data["compute_types"]
        assert "float16" in data["compute_types"]
        assert "float32" in data["compute_types"]

    def test_get_supported_languages_should_return_language_codes(
        self, client: TestClient
    ):
        """Test that GET /settings/transcription/whisperx/languages returns supported language objects"""
        response = client.get("/settings/transcription/whisperx/languages")

        assert response.status_code == 200
        languages = response.json()
        assert isinstance(languages, list)
        assert len(languages) == 40
        
        # Verify structure of language objects
        assert all("code" in lang and "name" in lang for lang in languages)

        # Check some known languages by extracting codes
        codes = [lang["code"] for lang in languages]
        assert "en" in codes
        assert "es" in codes
        assert "fr" in codes
        assert "de" in codes
        assert "zh" in codes
        
        # Check that names are present
        english = next(lang for lang in languages if lang["code"] == "en")
        assert english["name"] == "English"
        
        spanish = next(lang for lang in languages if lang["code"] == "es")
        assert spanish["name"] == "Spanish"

    def test_get_whisperx_configuration_should_return_defaults_when_not_configured(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that GET /settings/transcription/whisperx returns default configuration"""
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.get("/settings/transcription/whisperx", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["model_size"] == "tiny"
        assert data["compute_type"] == "int8"

    def test_get_whisperx_configuration_should_return_user_settings(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that GET returns user's configured WhisperX settings"""
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "transcription": {
                    "whisperx": {
                        "model_size": "medium",
                        "compute_type": "float16",
                    }
                }
            },
        }

        response = client.get("/settings/transcription/whisperx", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["model_size"] == "medium"
        assert data["compute_type"] == "float16"

    def test_update_whisperx_configuration_should_save_settings(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH /settings/transcription/whisperx saves configuration"""

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
                    "transcription": {
                        "whisperx": {
                            "model_size": "large",
                            "compute_type": "float32",
                        }
                    }
                },
            }

        mock_mongo.find_one.side_effect = mongo_side_effect

        request_data = {
            "model_size": "large",
            "compute_type": "float32",
        }

        response = client.patch(
            "/settings/transcription/whisperx",
            headers=auth_headers,
            json=request_data,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["model_size"] == "large"
        assert data["compute_type"] == "float32"

        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert "settings.transcription.whisperx.model_size" in str(call_args)
        assert "settings.transcription.whisperx.compute_type" in str(call_args)

    def test_update_whisperx_configuration_should_allow_partial_update(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH allows updating only model_size or compute_type"""

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
                    "transcription": {
                        "whisperx": {
                            "model_size": "large",  # Updated value
                            "compute_type": "int8",  # Original value (not updated)
                        }
                    }
                },
            }

        mock_mongo.find_one.side_effect = mongo_side_effect

        response = client.patch(
            "/settings/transcription/whisperx",
            headers=auth_headers,
            json={"model_size": "large"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["model_size"] == "large"
        assert data["compute_type"] == "int8"

        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        update_dict = call_args[0][1]["$set"]
        assert "settings.transcription.whisperx.model_size" in update_dict
        assert (
            "settings.transcription.whisperx.compute_type" not in update_dict
        )  # Not updated

    def test_update_whisperx_configuration_should_reject_invalid_model_size(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH rejects invalid model_size values"""
        _ = mock_mongo

        request_data = {
            "model_size": "invalid_model",
        }

        response = client.patch(
            "/settings/transcription/whisperx",
            headers=auth_headers,
            json=request_data,
        )

        assert response.status_code == 422
        mock_mongo.update_one.assert_not_called()

    def test_update_whisperx_configuration_should_reject_invalid_compute_type(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH rejects invalid compute_type values"""
        _ = mock_mongo

        request_data = {
            "compute_type": "invalid_type",
        }

        response = client.patch(
            "/settings/transcription/whisperx",
            headers=auth_headers,
            json=request_data,
        )

        assert response.status_code == 422
        mock_mongo.update_one.assert_not_called()

    def test_update_whisperx_configuration_should_require_authentication(
        self, client: TestClient, mock_mongo
    ):
        """Test that PATCH /settings/transcription/whisperx requires authentication"""
        _ = mock_mongo

        response = client.patch(
            "/settings/transcription/whisperx",
            json={"model_size": "medium"},
        )

        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    def test_update_whisperx_configuration_should_accept_empty_body(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH with empty body returns current settings without error"""
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {
                "transcription": {
                    "whisperx": {
                        "model_size": "base",
                        "compute_type": "float16",
                    }
                }
            },
        }

        response = client.patch(
            "/settings/transcription/whisperx",
            headers=auth_headers,
            json={},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["model_size"] == "base"
        assert data["compute_type"] == "float16"

        mock_mongo.update_one.assert_not_called()
