from typing import Literal

import ollama
from openai import OpenAI

from .logging import setup_logger
from .settings import settings

ProviderName = Literal["OpenAI", "Ollama"]

_logger = setup_logger(__name__)


def create_openai_client(
    provider: ProviderName,
    *,
    api_key: str | None = None,
    base_url: str | None = None,
    ensure_model_available: str | None = None,
) -> OpenAI:
    """
    Create OpenAI client for the specified provider

    Args:
        provider: Provider name ("OpenAI" or "Ollama")
        api_key: API key for OpenAI (required for OpenAI provider)
        base_url: Custom base URL for Ollama (optional, defaults to settings)
        ensure_model_available: For Ollama, model name to pull if not available (optional)

    Returns:
        Configured OpenAI client

    Raises:
        ValueError: If OpenAI provider is used without api_key
        RuntimeError: If Ollama model pulling fails
    """
    match provider:
        case "OpenAI":
            if api_key is None:
                raise ValueError("OpenAI provider requires 'api_key' parameter")
            return OpenAI(api_key=api_key)

        case "Ollama":
            if ensure_model_available:
                _ensure_ollama_model_available(ensure_model_available)
            
            final_url = base_url if base_url is not None else settings.ollama_url + "/v1"
            return OpenAI(base_url=final_url, api_key="not-needed")


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
