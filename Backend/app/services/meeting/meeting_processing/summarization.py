from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from ....core.llm_factory import get_llm_for_user
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
    settings_repo = SettingsMongoRepository()

    llm_config = settings_repo.get_summary_model(username)

    _logger.debug(f"LLM config: {llm_config}")
    llm = get_llm_for_user(llm_config, settings_repo, username)

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", processing_config.system_prompt),
            ("human", "{dialogue}"),
        ]
    )

    result = (prompt | llm | StrOutputParser()).invoke({"dialogue": diarized_dialogue})

    _logger.debug(f"Meeting summary created using model {llm_config.model_name}")
    return result
