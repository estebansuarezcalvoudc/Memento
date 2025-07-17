import os
import tempfile

import whisperx
from sqlmodel import Session
import whisperx.diarize

from ..core.config import settings
from ..core.logging import setup_logger
from ..models.meeting_model import CreateMeetingRequest, Meeting, MeetingResponse

_logger = setup_logger(__name__)


def process_meeting(
    meeting: CreateMeetingRequest, audio_bytes: bytes, session: Session
) -> MeetingResponse:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(audio_bytes)
        temp_file_path = temp_file.name

    try:
        transcription = _process_audio_file(meeting, temp_file_path)

        db_meeting = Meeting(
            title=meeting.title,
            date=meeting.date,
            transcription=transcription,
        )

        session.add(db_meeting)
        session.commit()
        session.refresh(db_meeting)

        response = MeetingResponse(
            id=db_meeting.id or 0,
            title=db_meeting.title,
            date=db_meeting.date,
            transcription=db_meeting.transcription,
        )

        session.expunge(db_meeting)
        return response
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def _process_audio_file(meeting: CreateMeetingRequest, temp_file_path) -> str:
    audio = whisperx.load_audio(temp_file_path)

    transcription = _transcribe_meeting(audio, meeting.language)
    _logger.debug("Transcribed (1/5)")

    aligned = _align_meeting(transcription, audio)
    _logger.debug("Aligned (2/5)")

    segments = _diarize_meeting(audio)
    _logger.debug("Segmented (3/5)")

    diarized_conversation = whisperx.assign_word_speakers(segments, aligned)
    _logger.debug("Diarized (4/5)")

    conversation = _create_diarized_dialogue(diarized_conversation)
    _logger.debug("Conversation formatted (5/5)")

    return conversation


def _transcribe_meeting(audio, language=None):
    if language:
        model = whisperx.load_model(
            "tiny",
            "cpu",
            language=language,
            compute_type="int8",
        )
    else:
        model = whisperx.load_model("tiny", "cpu", compute_type="int8")

    return model.transcribe(audio, batch_size=10)


def _align_meeting(transcription, audio):
    model_a, metadata = whisperx.load_align_model(language_code="es", device="cpu")

    return whisperx.align(
        transcription["segments"],
        model_a,
        metadata,
        audio,
        "cpu",
        return_char_alignments=False,
    )


def _diarize_meeting(audio, number_of_speakers=None):
    if number_of_speakers:
        diarize_model = whisperx.diarize.DiarizationPipeline(  # type: ignore
            use_auth_token=settings.hf_token,
            device="cpu",
            min_speakers=number_of_speakers,  # type: ignore
            max_speakers=number_of_speakers,  # type: ignore
        )
    else:
        diarize_model = whisperx.diarize.DiarizationPipeline(
            use_auth_token=settings.hf_token, device="cpu"
        )

    return diarize_model(audio)


def _create_diarized_dialogue(diarized_conversation):
    segments = diarized_conversation["segments"]
    current_speaker = None
    conversation = ""

    for segment in segments:
        speaker = segment.get("speaker", "Unknown")
        text = segment.get("text", "")

        if speaker == current_speaker:
            conversation += f" {text.strip()}"
            continue

        if conversation:
            conversation += "\n\n\n"

        conversation += f"{speaker}:\n    {text.strip()}"
        current_speaker = speaker

    return conversation
