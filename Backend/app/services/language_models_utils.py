from logging import Logger

import ollama
from openai import OpenAI

from ..core.settings import settings
from ..schemas.conversation_schema import LanguageModelConfiguration
from ..schemas.language_models_schema import ProviderType


def create_openai_client(
    model_config: LanguageModelConfiguration, logger: Logger
) -> OpenAI:
    if model_config.provider == ProviderType.OPENAI:
        return OpenAI(api_key=settings.openai_key)

    _ensure_ollama_model_available(model_config, logger)
    return OpenAI(
        base_url=settings.ollama_url + "/v1",
        api_key="ollama",
    )


def _ensure_ollama_model_available(
    model_config: LanguageModelConfiguration, logger: Logger
) -> None:
    if model_config.provider != ProviderType.OLLAMA:
        return

    try:
        client = ollama.Client(host=settings.ollama_url)

        logger.info(f"Pulling Ollama model {model_config.model}...")
        client.pull(model_config.model)
        logger.info(f"Successfully pulled model {model_config.model}")

    except Exception as e:
        error_message = f"Failed to ensure Ollama model availability: {str(e)}"
        logger.error(error_message)
        raise RuntimeError(error_message) from e
