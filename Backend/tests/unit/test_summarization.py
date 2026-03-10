"""
Unit tests for services/meeting/meeting_processing/summarization.py
"""

from unittest.mock import MagicMock, patch

import pytest

from app.schemas.meeting.meeting_schema import ProcessingConfiguration

_PATCH_SETTINGS_REPO = (
    "app.services.meeting.meeting_processing.summarization.SettingsMongoRepository"
)
_PATCH_CREATE_LLM = "app.services.meeting.meeting_processing.summarization.create_llm"


def _make_llm_config(provider: str = "Ollama", model: str = "llama3.2:latest"):
    return MagicMock(provider=provider, model_name=model)


def _make_processing_config(prompt: str = "Summarize the following meeting:"):
    return ProcessingConfiguration(system_prompt=prompt)


class TestGetMeetingSummary:
    def test_get_meeting_summary_should_raise_runtime_error_when_api_key_missing(self):
        """Provider requires API key but none is configured → RuntimeError."""
        mock_repo = MagicMock()
        mock_repo.get_summary_model.return_value = _make_llm_config(provider="OpenAI")
        mock_repo.get_provider_settings.return_value = None  # no settings = no key

        with patch(_PATCH_SETTINGS_REPO, return_value=mock_repo):
            from app.services.meeting.meeting_processing.summarization import (
                get_meeting_summary,
            )

            with pytest.raises(RuntimeError, match="API key not configured"):
                get_meeting_summary(
                    diarized_dialogue="Speaker 1: Hello.",
                    processing_config=_make_processing_config(),
                    username="user@example.com",
                )

    def test_get_meeting_summary_should_return_llm_output_for_ollama(self):
        """Ollama does not require an API key — the chain should be invoked and its
        result returned."""
        mock_repo = MagicMock()
        mock_repo.get_summary_model.return_value = _make_llm_config(provider="Ollama")
        mock_repo.get_provider_settings.return_value = None  # Ollama has no DB entry

        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_chain.invoke.return_value = "The team discussed Q1 goals."

        with (
            patch(_PATCH_SETTINGS_REPO, return_value=mock_repo),
            patch(_PATCH_CREATE_LLM, return_value=mock_llm),
            patch(
                "app.services.meeting.meeting_processing.summarization.ChatPromptTemplate"
            ) as mock_prompt_cls,
        ):
            # Make prompt | llm | parser chain return mock_chain
            mock_prompt = MagicMock()
            mock_prompt_cls.from_messages.return_value = mock_prompt
            mock_prompt.__or__ = MagicMock(return_value=mock_chain)
            mock_chain.__or__ = MagicMock(return_value=mock_chain)

            from app.services.meeting.meeting_processing.summarization import (
                get_meeting_summary,
            )

            result = get_meeting_summary(
                diarized_dialogue="Speaker 1: Hello.",
                processing_config=_make_processing_config(),
                username="user@example.com",
            )

        assert result == "The team discussed Q1 goals."

    def test_get_meeting_summary_should_raise_runtime_error_when_provider_key_empty(
        self,
    ):
        """Provider settings exist but api_key_encrypted is falsy → RuntimeError."""
        mock_repo = MagicMock()
        mock_repo.get_summary_model.return_value = _make_llm_config(provider="OpenAI")
        mock_provider_settings = MagicMock()
        mock_provider_settings.api_key_encrypted = ""  # empty key
        mock_repo.get_provider_settings.return_value = mock_provider_settings

        with patch(_PATCH_SETTINGS_REPO, return_value=mock_repo):
            from app.services.meeting.meeting_processing.summarization import (
                get_meeting_summary,
            )

            with pytest.raises(RuntimeError, match="API key not configured"):
                get_meeting_summary(
                    diarized_dialogue="Speaker 1: Hello.",
                    processing_config=_make_processing_config(),
                    username="user@example.com",
                )
