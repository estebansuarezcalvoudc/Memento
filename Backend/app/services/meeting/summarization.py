from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.repositories.interfaces.settings_repo import SettingsRepository
from app.schemas.settings.templates_schema import DEFAULT_PROMPT

from ...core.llm_factory import get_llm_for_user
from ...core.logging import log_execution_time, setup_logger

_logger = setup_logger(__name__)


@log_execution_time(_logger)
def get_meeting_summary(
    diarized_dialogue: str,
    settings_repo: SettingsRepository,
    user_id: str,
) -> str:
    llm_config = settings_repo.get_summary_model(user_id)
    summarization_prompt = settings_repo.get_system_prompt(user_id) or DEFAULT_PROMPT

    _logger.debug(f"LLM config: {llm_config}")
    llm = get_llm_for_user(llm_config, settings_repo, user_id)

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", summarization_prompt),
            ("human", "{dialogue}"),
        ]
    )

    result = (prompt | llm | StrOutputParser()).invoke({"dialogue": diarized_dialogue})

    _logger.debug(f"Meeting summary created using model {llm_config.model_name}")
    return result
