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
    llm_config = processing_config.language_model_configuration

    # Factory handles API key retrieval and model availability
    openai = create_openai_client(
        provider=llm_config.provider.value,
        username=username,
        ensure_model_available=(
            llm_config.model if llm_config.provider.value == "Ollama" else None
        ),
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
