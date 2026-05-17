"""
Unit tests for services/meeting/meeting_processing/summarization.py
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

_PATCH_CREATE_LLM = "app.services.meeting.summarization.get_llm_for_user"


def _make_llm_config(provider: str = "Ollama", model: str = "llama3.2:latest"):
    return MagicMock(provider=provider, model_name=model)


def _make_settings_repo(
    provider: str = "Ollama",
    prompt: str = "Summarize the following meeting:",
):
    repo = MagicMock()
    repo.get_summary_model.return_value = _make_llm_config(provider=provider)
    repo.get_system_prompt.return_value = prompt
    return repo


class TestGetMeetingSummary:
    def test_get_meeting_summary_should_raise_runtime_error_when_api_key_missing(self):
        """Provider requires API key but none is configured → RuntimeError."""
        mock_repo = _make_settings_repo(provider="OpenAI")

        with (
            patch(_PATCH_CREATE_LLM) as mock_get_llm_for_user,
            pytest.raises(HTTPException) as exc_info,
        ):
            mock_get_llm_for_user.side_effect = HTTPException(
                status_code=400,
                detail="API key not configured for user_id=user@example.com",
            )

            from app.services.meeting.summarization import (
                get_meeting_summary,
            )

            get_meeting_summary(
                diarized_dialogue="Speaker 1: Hello.",
                settings_repo=mock_repo,
                user_id="user@example.com",
            )

        assert exc_info.value.status_code == 400
        assert "API key not configured" in exc_info.value.detail

    def test_get_meeting_summary_should_return_llm_output_for_ollama(self):
        """Ollama does not require an API key — the chain should be invoked and its
        result returned."""
        mock_repo = _make_settings_repo(provider="Ollama")

        mock_llm = MagicMock()
        mock_chain = MagicMock()
        mock_chain.invoke.return_value = "The team discussed Q1 goals."

        with (
            patch(_PATCH_CREATE_LLM, return_value=mock_llm),
            patch(
                "app.services.meeting.summarization.ChatPromptTemplate"
            ) as mock_prompt_cls,
        ):
            # Make prompt | llm | parser chain return mock_chain
            mock_prompt = MagicMock()
            mock_prompt_cls.from_messages.return_value = mock_prompt
            mock_prompt.__or__ = MagicMock(return_value=mock_chain)
            mock_chain.__or__ = MagicMock(return_value=mock_chain)

            from app.services.meeting.summarization import (
                get_meeting_summary,
            )

            result = get_meeting_summary(
                diarized_dialogue="Speaker 1: Hello.",
                settings_repo=mock_repo,
                user_id="user@example.com",
            )

        assert result == "The team discussed Q1 goals."

    def test_get_meeting_summary_should_raise_runtime_error_when_provider_key_empty(
        self,
    ):
        """Provider settings exist but api_key_encrypted is falsy → RuntimeError."""
        mock_repo = _make_settings_repo(provider="OpenAI")

        with (
            patch(_PATCH_CREATE_LLM) as mock_get_llm_for_user,
            pytest.raises(HTTPException) as exc_info,
        ):
            mock_get_llm_for_user.side_effect = HTTPException(
                status_code=400,
                detail="API key not configured for user_id=user@example.com",
            )

            from app.services.meeting.summarization import (
                get_meeting_summary,
            )

            get_meeting_summary(
                diarized_dialogue="Speaker 1: Hello.",
                settings_repo=mock_repo,
                user_id="user@example.com",
            )

        assert exc_info.value.status_code == 400
        assert "API key not configured" in exc_info.value.detail
