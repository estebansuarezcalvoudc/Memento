"""Integration tests for templates settings endpoints."""

from fastapi.testclient import TestClient

from app.schemas.meeting_schema import _DEFAULT_PROMPT


class TestTemplatesEndpoints:
    """Test suite for templates settings endpoints"""

    def test_get_default_prompt_should_return_system_default(self, client: TestClient):
        """Test that GET /settings/templates/default-prompt returns system default"""
        response = client.get("/settings/templates/default-prompt")

        assert response.status_code == 200
        data = response.json()
        assert "system_prompt" in data
        assert data["system_prompt"] == _DEFAULT_PROMPT

    def test_get_user_prompt_should_return_default_when_not_configured(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that GET /settings/templates/prompt returns default when user has no custom prompt"""
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.get("/settings/templates/prompt", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["system_prompt"] == _DEFAULT_PROMPT

    def test_get_user_prompt_should_return_custom_prompt(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that GET /settings/templates/prompt returns user's custom prompt"""
        custom_prompt = "Custom analysis prompt for meetings"
        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
            "settings": {"templates": {"system_prompt": custom_prompt}},
        }

        response = client.get("/settings/templates/prompt", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["system_prompt"] == custom_prompt

    def test_update_user_prompt_should_save_custom_prompt(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH /settings/templates/prompt saves custom prompt"""
        custom_prompt = (
            "My custom meeting analysis prompt. " * 10
        )  # Long enough (50+ chars)

        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.patch(
            "/settings/templates/prompt",
            headers=auth_headers,
            json={"system_prompt": custom_prompt},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["system_prompt"] == custom_prompt.strip()

        mock_mongo.update_one.assert_called_once()
        call_args = mock_mongo.update_one.call_args
        assert call_args[0][0] == {"username": "test@example.com"}
        assert "$set" in call_args[0][1]
        assert "settings.templates.system_prompt" in call_args[0][1]["$set"]

    def test_update_user_prompt_should_reject_short_prompt(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH /settings/templates/prompt rejects prompts shorter than 50 chars"""
        short_prompt = "Too short"  # Less than 50 chars

        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.patch(
            "/settings/templates/prompt",
            headers=auth_headers,
            json={"system_prompt": short_prompt},
        )

        assert response.status_code == 422
        assert "at least 50 characters" in str(response.json())

    def test_update_user_prompt_should_reject_long_prompt(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH /settings/templates/prompt rejects prompts longer than 5000 chars"""
        long_prompt = "A" * 5001  # More than 5000 chars

        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.patch(
            "/settings/templates/prompt",
            headers=auth_headers,
            json={"system_prompt": long_prompt},
        )

        assert response.status_code == 422
        assert "at most 5000 characters" in str(response.json())

    def test_update_user_prompt_should_reject_empty_prompt(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH /settings/templates/prompt rejects empty or whitespace-only prompts"""
        empty_prompt = "   \n\t   "  # Only whitespace

        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.patch(
            "/settings/templates/prompt",
            headers=auth_headers,
            json={"system_prompt": empty_prompt},
        )

        assert response.status_code == 422
        assert "at least 50 characters" in str(response.json())

    def test_update_user_prompt_should_trim_whitespace(
        self, client: TestClient, auth_headers: dict, mock_mongo
    ):
        """Test that PATCH /settings/templates/prompt trims leading/trailing whitespace"""
        # Arrange
        prompt_with_whitespace = "  " + ("Valid prompt text. " * 10) + "  "

        mock_mongo.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }

        response = client.patch(
            "/settings/templates/prompt",
            headers=auth_headers,
            json={"system_prompt": prompt_with_whitespace},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["system_prompt"] == prompt_with_whitespace.strip()
        assert not data["system_prompt"].startswith(" ")
        assert not data["system_prompt"].endswith(" ")
