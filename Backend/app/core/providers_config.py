"""
Shared provider configuration and default user settings.

This module is the single source of truth for which providers exist,
whether they require an API key, and what the default settings are for
a newly registered user. Keeping this data here — rather than inside a
repository implementation — means any future repository (SQL, Redis, …)
can still use the same defaults without duplicating domain knowledge.
"""

AVAILABLE_PROVIDERS: dict[str, dict] = {
    "OpenAI": {"requires_api_key": True},
    "Ollama": {"requires_api_key": False},
}

DEFAULT_USER_SETTINGS: dict = {
    "providers": {
        "Ollama": {"active": True},
        "OpenAI": {"active": False},
    },
    "models": {
        "chat_model": {
            "provider": "Ollama",
            "model_name": "llama3.2:latest",
            "temperature": 0.7,
            "max_tokens": 2000,
        }
    },
}
