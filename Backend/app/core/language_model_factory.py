from langchain_core.language_models import BaseChatModel
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.core.encryption import decrypt_api_key
from app.core.logging import setup_logger
from app.core.settings import settings
from app.schemas.settings.model_schema import ModelConfig

_logger = setup_logger(__name__)


def language_model_factory(
    llm_config: ModelConfig, api_key_encrypted: str
) -> BaseChatModel:
    _logger.debug(f"Creating model {llm_config.model_name}")

    match llm_config.provider:
        case "Ollama":
            return ChatOllama(
                base_url=settings.ollama_url,
                model=llm_config.model_name,
                temperature=llm_config.temperature,
                num_predict=llm_config.max_tokens,
            )
        case "OpenAI":
            api_key = decrypt_api_key(api_key_encrypted)
            return ChatOpenAI(
                api_key=api_key,
                model=llm_config.model_name,
                temperature=llm_config.temperature,
                max_tokens=llm_config.max_tokens,
            )
        case _:
            raise ValueError(
                f"Provider '{llm_config.provider}' is not a valid provider"
            )
