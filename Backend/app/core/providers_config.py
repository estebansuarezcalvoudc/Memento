"""
Shared provider configuration, default user settings, and provider operations.

This module is the single source of truth for which providers exist,
whether they require an API key, what the default settings are for
a newly registered user, and how to interact with each provider
(listing available models and creating LangChain LLM instances).
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal

import ollama
from langchain_core.language_models import BaseChatModel
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from openai import OpenAI

from .encryption import decrypt_api_key
from .settings import settings

if TYPE_CHECKING:
    from app.schemas.settings.model_schema import ModelConfig

ProviderName = Literal["OpenAI", "Ollama"]

AVAILABLE_PROVIDERS: dict[str, dict] = {
    "OpenAI": {"requires_api_key": True},
    "Ollama": {"requires_api_key": False},
}

DEFAULT_USER_SETTINGS: dict = {
    "models": {
        "chat_model": {
            "provider": "Ollama",
            "model_name": "llama3.2:latest",
            "temperature": 0.7,
            "max_tokens": 2000,
        },
        "summary_model": {
            "provider": "Ollama",
            "model_name": "llama3.2:latest",
            "temperature": 0.3,
            "max_tokens": 4000,
        },
        "retrieval_model": {
            "provider": "Ollama",
            "model_name": "llama3.2:latest",
            "temperature": 0.0,
            "max_tokens": 500,
        },
    },
}

_OPENAI_LLM_PREFIXES = ("gpt-", "o1-", "o3-", "o4-", "chatgpt-")


def _is_openai_llm(model_id: str) -> bool:
    return any(model_id.startswith(prefix) for prefix in _OPENAI_LLM_PREFIXES)


def list_models(
    provider_name: ProviderName, api_key_encrypted: str | None = None
) -> list[str]:
    match provider_name:
        case "OpenAI":
            api_key = decrypt_api_key(api_key_encrypted or "")
            client = OpenAI(api_key=api_key)
            return [m.id for m in client.models.list().data if _is_openai_llm(m.id)]
        case "Ollama":
            client = ollama.Client(host=settings.ollama_url)
            return [m.model for m in client.list().models]


def create_llm(
    config: "ModelConfig", api_key_encrypted: str | None = None
) -> BaseChatModel:
    match config.provider:
        case "OpenAI":
            return ChatOpenAI(
                api_key=decrypt_api_key(api_key_encrypted or ""),
                model=config.model_name,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
            )
        case "Ollama":
            return ChatOllama(
                base_url=settings.ollama_url,
                model=config.model_name,
                temperature=config.temperature,
                num_predict=config.max_tokens,
            )
