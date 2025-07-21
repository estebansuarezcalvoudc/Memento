import os
import tempfile

import ollama
import whisperx
import whisperx.diarize
from sqlmodel import Session

from ..core.config import settings
from ..core.logging import setup_logger
from ..models.meeting_model import CreateMeetingRequest, Meeting, MeetingResponse
from .summary_prompt import prompt

_logger = setup_logger(__name__)


def process_meeting(
    meeting: CreateMeetingRequest, audio_bytes: bytes, session: Session
) -> MeetingResponse:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(audio_bytes)
        temp_file_path = temp_file.name

    try:
        transcription, summary = _process_audio_file(meeting, temp_file_path)

        db_meeting = Meeting(
            title=meeting.title,
            date=meeting.date,
            transcription=transcription,
            summary=summary,
        )

        session.add(db_meeting)
        session.commit()
        session.refresh(db_meeting)

        response = MeetingResponse(
            id=db_meeting.id or 0,
            title=db_meeting.title,
            date=db_meeting.date,
            transcription=db_meeting.transcription,
            summary=summary,
        )

        session.expunge(db_meeting)
        return response
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def _process_audio_file(
    meeting: CreateMeetingRequest, temp_file_path
) -> tuple[str, str]:
    # audio = whisperx.load_audio(temp_file_path)

    # transcription = _transcribe_meeting(audio, meeting.language)
    # _logger.debug("Transcribed (1/6)")

    # aligned = _align_meeting(transcription, audio)
    # _logger.debug("Aligned (2/6)")

    #    segments = _diarize_meeting(audio)
    #   _logger.debug("Segmented (3/6)")

    #    diarized_conversation = whisperx.assign_word_speakers(segments, aligned)
    #   _logger.debug("Diarized (4/6)")

    #    conversation = _create_diarized_dialogue(diarized_conversation)
    #    _logger.debug("Conversation formatted (5/6)")

    summary = _summarize_meeting(
        "SPEAKER_00: what do you thing about climate change. SPEAKER_01: well, I believe it is a very important topic",
        meeting.summary_type or "balanced",
    )
    _logger.debug("Conversation summarized (6/6)")

    return "conversation", summary


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


def _summarize_meeting(diarized_dialogue: str, summary_type: str = "balanced") -> str:
    client = ollama.Client(host="http://ollama:11434")

    client.pull("llama3.2")

    client.create(model="summarizer", from_="llama3.2", system=prompt)

    response = client.chat(
        model="summarizer",
        messages=[{"role": "user", "content": diarized_dialogue}],
        options={"temperature": 0.2, "num_predict": 600},
    )

    summary = response.message.content

    return summary if summary else ""
