from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestAuthEndpoints:
    def test_register_should_create_user_and_return_token(
        self, client: TestClient, mock_mongo
    ):
        """Test that POST /auth/register creates a new user and returns access token"""
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
        """Test that POST /auth/register returns 400 when user already exists"""
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

    def test_register_should_validate_required_fields(self, client: TestClient):
        """Test that POST /auth/register validates required fields"""
        response = client.post("/auth/register", json={})

        assert response.status_code == 422  # Unprocessable Entity

        response = client.post("/auth/register", json={"username": "test@example.com"})
        assert response.status_code == 422

        response = client.post("/auth/register", json={"password": "securepass123"})
        assert response.status_code == 422

    def test_login_should_return_token_with_valid_credentials(
        self, client: TestClient, mock_mongo
    ):
        """Test that POST /auth/token returns token with valid credentials"""
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
        """Test that POST /auth/token returns 401 with invalid password"""
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
        """Test that POST /auth/token returns 401 for nonexistent user"""
        _ = mock_mongo  # Fixture needed for MongoDB mock setup
        mock_mongo.find_one.return_value = None

        response = client.post(
            "/auth/token",
            data={"username": "nonexistent@example.com", "password": "password123"},
        )

        assert response.status_code == 401
        assert "incorrect username or password" in response.json()["detail"].lower()

    def test_login_should_use_form_data_format(self, client: TestClient, mock_mongo):
        """Test that POST /auth/token uses OAuth2 form data format"""
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

    def test_login_should_validate_required_fields(self, client: TestClient):
        """Test that POST /auth/token validates required fields"""
        response = client.post("/auth/token", data={})
        assert response.status_code == 422

        response = client.post("/auth/token", data={"username": "test@example.com"})
        assert response.status_code == 422

        response = client.post("/auth/token", data={"password": "password123"})
        assert response.status_code == 422
