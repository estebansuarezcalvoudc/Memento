from typing import Literal

from openai import OpenAI

from .settings import settings

ProviderName = Literal["OpenAI", "Ollama"]


def create_openai_client(
    provider: ProviderName,
    *,
    api_key: str | None = None,
    base_url: str | None = None,
) -> OpenAI:
    """
    Create OpenAI client for the specified provider

    Args:
        provider: Provider name ("OpenAI" or "Ollama")
        api_key: API key for OpenAI (required for OpenAI provider)
        base_url: Custom base URL for Ollama (optional, defaults to settings)

    Returns:
        Configured OpenAI client

    Raises:
        ValueError: If OpenAI provider is used without api_key
    """
    match provider:
        case "OpenAI":
            if api_key is None:
                raise ValueError("OpenAI provider requires 'api_key' parameter")
            return OpenAI(api_key=api_key)

        case "Ollama":
            final_url = base_url if base_url is not None else settings.ollama_url + "/v1"
            return OpenAI(base_url=final_url, api_key="not-needed")
