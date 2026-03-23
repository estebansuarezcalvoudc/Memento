from __future__ import annotations

from pathlib import Path
from typing import Literal

import anthropic
import ollama
import yaml
from openai import OpenAI

from .encryption import decrypt_api_key
from .settings import settings

ProviderName = Literal["OpenAI", "Anthropic", "Ollama"]

AVAILABLE_PROVIDERS: dict[str, dict] = {
    "Ollama": {"requires_api_key": False},
    "OpenAI": {"requires_api_key": True},
    "Anthropic": {"requires_api_key": True},
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
    "transcription": {
        "active_provider": "whisperx",
        "providers": {
            "whisperx": {
                "model_size": "tiny",
                "compute_type": "int8",
                "device": "cuda",
            },
            "aai": {
                "speech_model": "universal",
                "speaker_labels": True,
            },
        },
    },
}

_ALLOWLIST_PATH = Path(__file__).parent / "models_allowlist.yaml"


def _load_models_allowlist() -> dict[str, set[str]]:
    """Load the curated model allowlist from the YAML config file.

    Returns a dict mapping provider name → set of allowed model IDs.
    Providers not present in the file are not filtered (all models allowed).
    """
    with _ALLOWLIST_PATH.open(encoding="utf-8") as f:
        raw: dict = yaml.safe_load(f) or {}
    return {provider: set(models) for provider, models in raw.items()}


# Loaded once at import time; restart the service to pick up YAML changes.
_MODELS_ALLOWLIST: dict[str, set[str]] = _load_models_allowlist()


def list_models(
    provider_name: ProviderName, api_key_encrypted: str | None = None
) -> list[str]:
    """Return available models for the given provider.

    If the provider has an entry in models_allowlist.yaml, only models that
    appear in BOTH the provider's API response AND the allowlist are returned.
    Providers without an allowlist entry (e.g. Ollama) are returned unfiltered.
    """
    match provider_name:
        case "OpenAI":
            api_key = decrypt_api_key(api_key_encrypted or "")
            client = OpenAI(api_key=api_key)
            return _apply_allowlist(
                provider_name, [m.id for m in client.models.list().data]
            )
        case "Anthropic":
            api_key = decrypt_api_key(api_key_encrypted or "")
            client = anthropic.Anthropic(api_key=api_key)

            return _apply_allowlist(
                provider_name, [m.id for m in client.models.list().data]
            )
        case "Ollama":
            client = ollama.Client(host=settings.ollama_url)
            return _apply_allowlist(
                provider_name,
                [
                    m.model
                    for m in client.list().models
                    if m.model is not None and m.model != "nomic-embed-text:latest"
                ],
            )
        case _:
            return []


def _apply_allowlist(provider_name: str, models: list[str]) -> list[str]:
    """Filter a list of model IDs against the allowlist for the given provider.

    If the provider has no allowlist entry, the original list is returned as-is.
    """
    allowlist = _MODELS_ALLOWLIST.get(provider_name)
    if allowlist is None:
        return models
    return [m for m in models if m in allowlist]
