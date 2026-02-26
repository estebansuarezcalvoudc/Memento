from langchain_core.language_models import BaseChatModel
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.core.settings import settings
from app.core.encryption import decrypt_api_key
from app.core.logging import setup_logger
from app.schemas.conversation.language_models_schema import LanguageModelConfiguration

_logger = setup_logger(__name__)


def language_model_factory(
    llm_config: LanguageModelConfiguration, api_key: str
) -> BaseChatModel:
    _logger.debug(f"Creating model {llm_config.model}")

    api_key = decrypt_api_key(api_key)

    provider = llm_config.provider.value
    options = llm_config.options.copy()
    temperature = options.pop("temperature")
    max_tokens = options.pop("max_tokens")

    match provider:
        case "Ollama":
            return ChatOllama(
                base_url=settings.ollama_url,
                model=llm_config.model,
                temperature=temperature,
                num_predict=max_tokens,
            )
        case "OpenAI":
            return ChatOpenAI(
                api_key=api_key,
                model=llm_config.model,
                temperature=temperature,
                max_tokens=max_tokens,
                model_kwargs=options,
            )
        case _:
            raise ValueError(f"Provider '{provider}' is not a valid provider")
