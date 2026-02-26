from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from ....core.language_model_factory import language_model_factory
from ....core.logging import log_execution_time, setup_logger
from ....repositories.implementations.mongo.settings_repo import SettingsMongoRepository
from ....schemas.meeting.meeting_schema import ProcessingConfiguration

_logger = setup_logger(__name__)


@log_execution_time(_logger)
def get_meeting_summary(
    diarized_dialogue: str,
    processing_config: ProcessingConfiguration,
    username: str,
) -> str:
    llm_config = processing_config.language_model_configuration

    settings_repo = SettingsMongoRepository()
    provider_settings = settings_repo.get_provider_settings(
        username, llm_config.provider.value
    )

    if not provider_settings or not provider_settings.api_key_encrypted:
        raise RuntimeError(
            f"{llm_config.provider.value} API key not configured for user {username}"
        )

    llm = language_model_factory(llm_config, provider_settings.api_key_encrypted)

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", processing_config.system_prompt),
            ("human", "{dialogue}"),
        ]
    )

    result = (prompt | llm | StrOutputParser()).invoke({"dialogue": diarized_dialogue})

    _logger.debug(f"Meeting summary created using model {llm_config.model}")
    return result
