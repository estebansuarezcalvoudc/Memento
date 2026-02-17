from typing import Literal

import ollama
from openai import OpenAI

from .encryption import decrypt_api_key
from .logging import setup_logger
from .settings import settings

ProviderName = Literal["OpenAI", "Ollama"]

_logger = setup_logger(__name__)


def create_openai_client(
    provider: ProviderName,
    *,
    username: str | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
    ensure_model_available: str | None = None,
) -> OpenAI:
    """
    Create OpenAI client for the specified provider

    Args:
        provider: Provider name ("OpenAI" or "Ollama")
        username: Username for retrieving API key from settings (required for OpenAI if api_key not provided)
        api_key: API key for OpenAI (optional, will be retrieved from settings if not provided)
        base_url: Custom base URL for Ollama (optional, defaults to settings)
        ensure_model_available: For Ollama, model name to pull if not available (optional)

    Returns:
        Configured OpenAI client

    Raises:
        ValueError: If OpenAI provider is used without api_key or username
        RuntimeError: If Ollama model pulling fails or API key retrieval fails
    """
    match provider:
        case "OpenAI":
            final_api_key = api_key
            if final_api_key is None:
                if username is None:
                    raise ValueError(
                        "OpenAI provider requires either 'api_key' or 'username' parameter"
                    )
                final_api_key = _get_api_key_from_settings(username, provider)
            return OpenAI(api_key=final_api_key)

        case "Ollama":
            if ensure_model_available:
                _ensure_ollama_model_available(ensure_model_available)

            final_url = (
                base_url if base_url is not None else settings.ollama_url + "/v1"
            )
            return OpenAI(base_url=final_url, api_key="not-needed")


def _get_api_key_from_settings(username: str, provider: ProviderName) -> str:
    """
    Retrieve and decrypt API key from user settings

    Args:
        username: Username to retrieve API key for
        provider: Provider name

    Returns:
        Decrypted API key

    Raises:
        RuntimeError: If API key is not configured or cannot be retrieved
    """
    from ..repositories.settings.settings_repo import SettingsRepository

    try:
        settings_repo = SettingsRepository()
        provider_settings = settings_repo.get_provider_settings(username, provider)

        if not provider_settings or not provider_settings.api_key_encrypted:
            raise RuntimeError(f"{provider} API key not configured for user {username}")

        return decrypt_api_key(provider_settings.api_key_encrypted)

    except Exception as e:
        error_message = f"Failed to retrieve API key for {provider}: {str(e)}"
        _logger.error(error_message)
        raise RuntimeError(error_message) from e


def _ensure_ollama_model_available(model_name: str) -> None:
    """
    Ensure Ollama model is available by pulling it if necessary

    Args:
        model_name: Name of the Ollama model to ensure is available

    Raises:
        RuntimeError: If model pulling fails
    """
    try:
        client = ollama.Client(host=settings.ollama_url)
        _logger.info(f"Pulling Ollama model {model_name}...")
        client.pull(model_name)
        _logger.info(f"Successfully pulled model {model_name}")
    except Exception as e:
        error_message = f"Failed to ensure Ollama model availability: {str(e)}"
        _logger.error(error_message)
        raise RuntimeError(error_message) from e
