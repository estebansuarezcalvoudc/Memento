from ...core.logging import log_execution_time, setup_logger
from ...schemas.meeting_schema import ProcessingConfiguration
from ..language_models_utils import create_openai_client

_logger = setup_logger(__name__)


@log_execution_time(_logger)
def get_meeting_summary(
    diarized_dialogue: str, processing_config: ProcessingConfiguration
) -> str:
    openai = create_openai_client(
        processing_config.language_model_configuration, _logger
    )

    model_options = processing_config.language_model_configuration.options or {}

    response = openai.chat.completions.create(
        model=processing_config.language_model_configuration.model,
        messages=[
            {"role": "system", "content": processing_config.system_prompt},
            {"role": "user", "content": diarized_dialogue},
        ],
        **model_options,
    )

    model = processing_config.language_model_configuration.model
    _logger.info(f"Meeting summary created using model {model}")

    return response.choices[0].message.content or ""
