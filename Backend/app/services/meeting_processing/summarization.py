from ...core.logging import log_execution_time, setup_logger
from ...core.openai_factory import create_openai_client
from ...schemas.meeting_schema import ProcessingConfiguration

_logger = setup_logger(__name__)


@log_execution_time(_logger)
def get_meeting_summary(
    diarized_dialogue: str, 
    processing_config: ProcessingConfiguration,
    username: str,
) -> str:
    from ...repositories.settings.settings_repo import SettingsRepository
    from ...core.encryption import decrypt_api_key
    
    llm_config = processing_config.language_model_configuration
    
    # Get API key from user settings if using OpenAI
    api_key = None
    if llm_config.provider.value == "OpenAI":
        settings_repo = SettingsRepository()
        provider_settings = settings_repo.get_provider_settings(username, "OpenAI")
        if not provider_settings or not provider_settings.api_key_encrypted:
            raise ValueError("OpenAI API key not configured for user")
        api_key = decrypt_api_key(provider_settings.api_key_encrypted)
    
    # For Ollama, ensure model is available
    ensure_model = llm_config.model if llm_config.provider.value == "Ollama" else None
    
    openai = create_openai_client(
        provider=llm_config.provider.value, 
        api_key=api_key,
        ensure_model_available=ensure_model
    )

    model_options = llm_config.options or {}

    response = openai.chat.completions.create(
        model=llm_config.model,
        messages=[
            {"role": "system", "content": processing_config.system_prompt},
            {"role": "user", "content": diarized_dialogue},
        ],
        **model_options,
    )

    _logger.info(f"Meeting summary created using model {llm_config.model}")

    return response.choices[0].message.content or ""
