from fastapi import HTTPException, status
from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseChatModel
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.repositories.interfaces.settings_repo import SettingsRepository
from app.schemas.settings.model_schema import ModelConfig

from .encryption import decrypt_api_key
from .providers_config import AVAILABLE_PROVIDERS
from .settings import settings


def create_llm(
    config: ModelConfig, api_key_encrypted: str | None = None
) -> BaseChatModel:
    """Instantiate a LangChain chat model from a ModelConfig.

    Args:
        config: Model configuration (provider, model name, temperature, etc.)
        api_key_encrypted: Encrypted API key. Required for providers that need
            one (e.g. OpenAI); ignored for local providers (e.g. Ollama).
    """
    match config.provider:
        case "OpenAI":
            return ChatOpenAI(
                api_key=SecretStr(decrypt_api_key(api_key_encrypted or "")),
                model=config.model_name,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
            )
        case "Anthropic":
            return ChatAnthropic(
                model=config.model_name,
                anthropic_api_key=SecretStr(decrypt_api_key(api_key_encrypted or "")),
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                stop=None,
            )
        case "Ollama":
            return ChatOllama(
                base_url=settings.ollama_url,
                model=config.model_name,
                temperature=config.temperature,
                num_predict=config.max_tokens,
            )
        case _:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported provider: {config.provider}",
            )


def get_llm_for_user(
    config: ModelConfig,
    settings_repo: SettingsRepository,
    user_id: str,
) -> BaseChatModel:
    """Resolve the API key for a user and instantiate an LLM.

    Fetches provider settings from the repository, validates that an API key
    is present when the provider requires one, then delegates to create_llm.

    Raises:
        HTTPException 400: If the provider requires an API key and none is
            configured for the user.
    """
    provider_settings = settings_repo.get_provider_settings(user_id, config.provider)

    requires_api_key = AVAILABLE_PROVIDERS.get(config.provider, {}).get(
        "requires_api_key", True
    )
    if requires_api_key and (
        provider_settings is None or not provider_settings.api_key_encrypted
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"API key not configured for user_id={user_id}",
        )

    api_key = provider_settings.api_key_encrypted if provider_settings else ""
    return create_llm(config, api_key or "")
