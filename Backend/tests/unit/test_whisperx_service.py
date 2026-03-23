"""
Unit tests for WhisperXTranscriptionService.

Tests focus on pure logic (no real whisperx/GPU calls):
  - _build_dialogue   — pure string builder
  - get_supported_languages
  - get_available_options
  - get_user_configuration (with and without stored settings)
  - update_user_configuration (valid and invalid input)
"""

from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_service(settings_dict=None):
    """Return a WhisperXTranscriptionService with a mocked repo and no real GPU init."""
    mock_repo = MagicMock()
    mock_repo.get_transcription_provider_settings.return_value = settings_dict

    with patch(
        "app.services.transcription.implementations.whisperx"
        ".whisperx_transcription_service.get_device",
        return_value="cpu",
    ):
        from app.services.transcription.implementations.whisperx.whisperx_transcription_service import (
            WhisperXTranscriptionService,
        )

        service = WhisperXTranscriptionService(mock_repo)

    return service, mock_repo


# ---------------------------------------------------------------------------
# _build_dialogue
# ---------------------------------------------------------------------------


class TestBuildDialogue:
    def test_build_dialogue_should_return_empty_string_for_no_segments(self):
        service, _ = _make_service()
        result = service._build_dialogue({"segments": []})
        assert result == ""

    def test_build_dialogue_should_wrap_each_speaker_in_paragraph_tag(self):
        service, _ = _make_service()
        segments = [{"speaker": "SPEAKER_00", "text": "Hello there."}]
        result = service._build_dialogue({"segments": segments})
        assert result == "<p><strong>SPEAKER_00:</strong> Hello there.</p>"

    def test_build_dialogue_should_merge_consecutive_segments_from_same_speaker(self):
        service, _ = _make_service()
        segments = [
            {"speaker": "SPEAKER_00", "text": "Hello."},
            {"speaker": "SPEAKER_00", "text": "How are you?"},
        ]
        result = service._build_dialogue({"segments": segments})
        # Should be a single paragraph, not two
        assert result.count("<p>") == 1
        assert "Hello." in result
        assert "How are you?" in result

    def test_build_dialogue_should_create_new_paragraph_for_different_speaker(self):
        service, _ = _make_service()
        segments = [
            {"speaker": "SPEAKER_00", "text": "Hello."},
            {"speaker": "SPEAKER_01", "text": "Hi there."},
        ]
        result = service._build_dialogue({"segments": segments})
        assert result.count("<p>") == 2
        assert "SPEAKER_00" in result
        assert "SPEAKER_01" in result

    def test_build_dialogue_should_use_unknown_when_speaker_key_missing(self):
        service, _ = _make_service()
        segments = [{"text": "Some text without speaker key."}]
        result = service._build_dialogue({"segments": segments})
        assert "Unknown" in result


# ---------------------------------------------------------------------------
# get_supported_languages
# ---------------------------------------------------------------------------


class TestGetSupportedLanguages:
    def test_get_supported_languages_should_return_sorted_list(self):
        service, _ = _make_service()
        languages = service.get_supported_languages()
        names = [lang.name for lang in languages]
        assert names == sorted(names)

    def test_get_supported_languages_should_return_language_option_objects(self):
        from app.schemas.transcription.transcription_schema import LanguageOption

        service, _ = _make_service()
        languages = service.get_supported_languages()
        assert all(isinstance(lang, LanguageOption) for lang in languages)
        assert len(languages) > 0


# ---------------------------------------------------------------------------
# get_available_options
# ---------------------------------------------------------------------------


class TestGetAvailableOptions:
    def test_get_available_options_should_return_non_empty_lists(self):
        service, _ = _make_service()
        options = service.get_available_options()
        assert len(options.models) > 0
        assert len(options.compute_types) > 0
        assert len(options.devices) > 0

    def test_get_available_options_should_include_cpu_device(self):
        service, _ = _make_service()
        options = service.get_available_options()
        assert "cpu" in options.devices


# ---------------------------------------------------------------------------
# get_user_configuration
# ---------------------------------------------------------------------------


class TestGetUserConfiguration:
    def test_get_user_configuration_should_return_defaults_when_no_settings_stored(
        self,
    ):
        from app.schemas.settings.whisperx_schema import WhisperXConfiguration

        service, _ = _make_service(settings_dict=None)
        config = service.get_user_configuration("user123")
        defaults = WhisperXConfiguration()
        assert config.model_size == defaults.model_size
        assert config.compute_type == defaults.compute_type
        assert config.device == defaults.device

    def test_get_user_configuration_should_return_stored_settings(self):
        service, _ = _make_service(
            settings_dict={
                "model_size": "large-v2",
                "compute_type": "float16",
                "device": "cpu",
            }
        )
        config = service.get_user_configuration("user123")
        assert config.model_size == "large-v2"
        assert config.compute_type == "float16"


# ---------------------------------------------------------------------------
# update_user_configuration
# ---------------------------------------------------------------------------


class TestUpdateUserConfiguration:
    def test_update_user_configuration_should_persist_valid_data(self):
        service, mock_repo = _make_service()
        service.update_user_configuration("user123", {"model_size": "small"})
        mock_repo.update_transcription_provider_settings.assert_called_once_with(
            "user123", "whisperx", {"model_size": "small"}
        )

    def test_update_user_configuration_should_raise_422_for_invalid_device(self):
        from fastapi import HTTPException

        service, mock_repo = _make_service()
        with pytest.raises(HTTPException) as exc_info:
            service.update_user_configuration("user123", {"device": "tpu"})
        assert exc_info.value.status_code == 422
        mock_repo.update_transcription_provider_settings.assert_not_called()

    def test_update_user_configuration_should_not_call_repo_when_payload_is_empty(self):
        service, mock_repo = _make_service()
        service.update_user_configuration("user123", {})
        mock_repo.update_transcription_provider_settings.assert_not_called()
