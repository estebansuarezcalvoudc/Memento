from ...core.logging import log_execution_time, setup_logger
from ...schemas.meeting_schema import ProcessingConfiguration
from ..language_models_utils import create_openai_client

_logger = setup_logger(__name__)

# TODO inyect these options as a dependency from the router
_MAX_COMPLETION_TOKENS = 600
_TEMPERATURE = 0.2

_DEFAULT_PROMPT = """
    Analyze this meeting transcript and provide a structured summary with the following:

    1. Meeting Overview
    - Meeting date and duration
    - List of participants (if mentioned)
    - Main objectives discussed

    2. Key Decisions
    - Document all final decisions made
    - Include any deadlines or timelines established
    - Note any budgets or resources allocated

    3. Action Items
    - List each action item with:
        * Assigned owner
        * Due date (if specified)
        * Dependencies or prerequisites
        * Current status (if mentioned)

    4. Discussion Topics
    - Summarize main points for each topic
    - Highlight any challenges or risks identified
    - Note any unresolved questions requiring follow-up

    5. Next Steps
    - Upcoming milestones
    - Scheduled follow-up meetings
    - Required preparations for next discussion

    ROLE: You are a professional meeting analyst focused on extracting actionable
    insights.

    FORMAT: Present the information in clear sections with bullet points for easy
    scanning. Keep descriptions concise but include specific details like names, dates,
    and numbers when mentioned

    If any of these elements are not discussed in the meeting, note their absence rather
    than making assumptions.
""".strip()


@log_execution_time(_logger)
def get_meeting_summary(
    diarized_dialogue: str, processing_config: ProcessingConfiguration
) -> str:
    openai = create_openai_client(
        processing_config.language_model_configuration, _logger
    )

    response = openai.chat.completions.create(
        model=processing_config.language_model_configuration.model,
        messages=[
            {"role": "system", "content": _DEFAULT_PROMPT},
            {"role": "user", "content": diarized_dialogue},
        ],
        max_completion_tokens=_MAX_COMPLETION_TOKENS,
        temperature=_TEMPERATURE,
    )

    model = processing_config.language_model_configuration.model
    _logger.info(f"Meeting summary created using model {model}")

    return response.choices[0].message.content or ""
