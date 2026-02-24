"""
Pytest configuration and shared fixtures

This file contains fixtures that are automatically available to all tests.
"""

import os
from typing import Generator
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Set test environment variables before importing app
os.environ["ENCRYPTION_KEY"] = (
    "obiWVK9qLu_vz-2Kr540yaKuxxa2exJprn2THT2u6U0="  # Valid base64 Fernet key
)
os.environ["MONGO_USER"] = "test_user"
os.environ["MONGO_PASSWORD"] = "test_password"
os.environ["MONGO_HOST"] = "localhost"
os.environ["MONGO_PORT"] = "27017"
os.environ["SECRET_KEY"] = "test_secret_key_for_jwt_tokens"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["OPENAI_KEY"] = "sk-test-key"
os.environ["HF_TOKEN"] = "test-hf-token"
os.environ["OLLAMA_HOST"] = "localhost"
os.environ["OLLAMA_PORT"] = "11434"

from app.main import app


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """
    Provides a TestClient for making requests to the FastAPI app

    Scope: function - New client for each test
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def mock_mongo():
    """
    Mock MongoDB connection to avoid real database operations

    Returns a mock that simulates MongoDB collection behavior
    """
    with patch("pymongo.MongoClient") as mock_client:
        mock_db = MagicMock()
        mock_collection = MagicMock()

        # Setup the mock chain: client -> db -> collection
        mock_client.return_value.__getitem__.return_value = mock_db
        mock_db.__getitem__.return_value = mock_collection

        # Default responses
        mock_collection.find_one.return_value = {
            "username": "test@example.com",
            "password": "$2b$12$test_hashed_password",
        }
        mock_collection.update_one.return_value = MagicMock(modified_count=1)

        yield mock_collection


@pytest.fixture(scope="function")
def mock_openai():
    """
    Mock OpenAI API client to avoid real API calls during tests
    """
    with patch("app.services.settings.providers_service.OpenAI") as mock_openai_class:
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        # Mock successful models.list() call
        mock_client.models.list.return_value = ["gpt-4", "gpt-3.5-turbo"]

        yield mock_client


@pytest.fixture(scope="function")
def test_user_token() -> str:
    """
    Creates a valid JWT token for testing without calling auth endpoint

    Returns a token that passes authentication
    """
    from datetime import datetime, timedelta, timezone

    import jwt

    # Use same settings as app
    secret_key = os.environ["SECRET_KEY"]
    algorithm = os.environ["ALGORITHM"]

    # Create token with test user
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    to_encode = {"sub": "test@example.com", "exp": expire}
    access_token = jwt.encode(to_encode, secret_key, algorithm=algorithm)

    return access_token


@pytest.fixture(scope="function")
def auth_headers(test_user_token: str) -> dict:
    """
    Returns headers with authentication token for making authenticated requests
    """
    return {"Authorization": f"Bearer {test_user_token}"}
