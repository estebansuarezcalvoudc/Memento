import tempfile

import whisperx
from sqlmodel import Session

from ...models.meeting_model import CreateMeetingRequest
from .summarize import summarize_meeting
from .transcribe import get_transcribed_conversation
from .utils import get_device, log_execution_time
from ...repositories.meeting_repo import create_meeting

def process_meeting(
    meeting: CreateMeetingRequest, audio_bytes: bytes, session: Session
):
    device = get_device()
    compute_type = "int8"
    model_size = "tiny"

    audio = _get_audio(audio_bytes)

    transcription = log_execution_time(
        get_transcribed_conversation, meeting, audio, device, compute_type, model_size
    )
    summary = log_execution_time(summarize_meeting, transcription)

    return create_meeting(session, meeting, transcription, summary)


def _get_audio(audio_bytes: bytes):
    with tempfile.NamedTemporaryFile(suffix=".wav") as temp_file:
        temp_file.write(audio_bytes)
        temp_file.flush()
        return whisperx.load_audio(temp_file.name)
