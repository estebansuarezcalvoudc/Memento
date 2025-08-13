import ollama
from openai import OpenAI

from ..core.logging import setup_logger
from ..core.settings import settings
from ..schemas.conversation_schema import ModelConfiguration, ProviderType

_logger = setup_logger(__name__, log_file="mcp_client.log", show_file_name=False)


def create_openai_client(model_configuration: ModelConfiguration) -> OpenAI:
    if model_configuration.provider == ProviderType.OPENAI:
        return OpenAI(api_key=settings.openai_key)

    _ensure_ollama_model_available(model_configuration)
    return OpenAI(
        base_url=settings.ollama_url + "/v1",
        api_key="ollama",
    )


def _ensure_ollama_model_available(model_configuration: ModelConfiguration) -> None:
    if model_configuration.provider != ProviderType.OLLAMA:
        return

    try:
        client = ollama.Client(host=settings.ollama_url)

        _logger.info(f"Pulling Ollama model {model_configuration.model}...")
        client.pull(model_configuration.model)
        _logger.info(f"Successfully pulled model {model_configuration.model}")

    except Exception as e:
        error_message = f"Failed to ensure Ollama model availability: {str(e)}"
        _logger.error(error_message)
        raise RuntimeError(error_message) from e
