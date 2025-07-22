import os
import tempfile

import ollama
import torch
import whisperx
import whisperx.diarize
from sqlmodel import Session

from ..core.config import settings
from ..core.logging import setup_logger
from ..models.meeting_model import CreateMeetingRequest, Meeting, MeetingResponse
from .summary_prompt import prompt
import time

_logger = setup_logger(__name__)


def _get_device():
    if not torch.cuda.is_available():
        _logger.info("CUDA not available, using CPU")
        return "cpu"

    try:
        # Test GPU functionality with a simple operation
        test_tensor = torch.tensor([1.0]).cuda()
        del test_tensor
        torch.cuda.empty_cache()

        device_count = torch.cuda.device_count()
        gpu_name = torch.cuda.get_device_name(0)
        memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        _logger.info(
            f"GPU acceleration enabled - Using {device_count} GPU(s): {gpu_name} ({memory_gb:.1f}GB)"
        )

        # Enable TF32 for better performance on compatible hardware
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        _logger.debug("TF32 enabled for improved GPU performance")

        return "cuda"
    except Exception as e:
        _logger.warning(f"CUDA available but GPU test failed: {e}. Falling back to CPU")
        return "cpu"


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
    start_time = time.time()

    # Get the best available device
    device = _get_device()
    compute_type = "int8"
    model_size = "tiny"

    audio = whisperx.load_audio(temp_file_path)

    try:
        transcription = _transcribe_meeting(
            audio, meeting.language, device, compute_type, model_size
        )
        _logger.debug("Transcribed (1/6)")

        # Clear GPU cache after transcription if using CUDA
        if device == "cuda":
            torch.cuda.empty_cache()

        aligned = _align_meeting(transcription, audio, device)
        _logger.debug("Aligned (2/6)")

        # Clear GPU cache after alignment if using CUDA
        if device == "cuda":
            torch.cuda.empty_cache()

        segments = _diarize_meeting(audio, device)
        _logger.debug("Segmented (3/6)")

        # Clear GPU cache after diarization if using CUDA
        if device == "cuda":
            torch.cuda.empty_cache()

        diarized_conversation = whisperx.assign_word_speakers(segments, aligned)
        _logger.debug("Diarized (4/6)")

        conversation = _create_diarized_dialogue(diarized_conversation)
        _logger.debug("Conversation formatted (5/6)")

        summary = _summarize_meeting(conversation)
        _logger.debug("Conversation summarized (6/6)")

        total_time = time.time() - start_time
        minutes = int(total_time // 60)
        seconds = int(total_time % 60)
        _logger.info(
            f"Total processing time: {minutes}m {seconds}s using {device.upper()}"
        )

        return conversation, summary

    finally:
        # Clear GPU cache if using CUDA
        if device == "cuda" and torch.cuda.is_available():
            torch.cuda.empty_cache()
            memory_allocated = torch.cuda.memory_allocated() / (1024**3)
            memory_reserved = torch.cuda.memory_reserved() / (1024**3)
            _logger.debug(
                f"GPU memory after cleanup - Allocated: {memory_allocated:.2f}GB, Reserved: {memory_reserved:.2f}GB"
            )


def _transcribe_meeting(
    audio, language=None, device="cpu", compute_type="int8", model_size="tiny"
):
    _logger.debug(
        f"Loading {model_size} transcription model on device: {device} with compute_type: {compute_type}"
    )

    try:
        if language:
            model = whisperx.load_model(
                model_size,
                device,
                language=language,
                compute_type=compute_type,
            )
        else:
            model = whisperx.load_model(model_size, device, compute_type=compute_type)

        return model.transcribe(audio, batch_size=10)
    except Exception as e:
        if device == "cuda":
            _logger.warning(f"Transcription failed on GPU: {e}. Retrying on CPU")
            return _transcribe_meeting(audio, language, "cpu", "int8", "tiny")
        else:
            raise e


def _align_meeting(transcription, audio, device="cpu"):
    _logger.debug(f"Loading alignment model on device: {device}")

    try:
        model_a, metadata = whisperx.load_align_model(language_code="es", device=device)

        return whisperx.align(
            transcription["segments"],
            model_a,
            metadata,
            audio,
            device,
            return_char_alignments=False,
        )
    except Exception as e:
        if device == "cuda":
            _logger.warning(f"Alignment failed on GPU: {e}. Retrying on CPU")
            return _align_meeting(transcription, audio, "cpu")
        else:
            raise e


def _diarize_meeting(audio, device="cpu", number_of_speakers=None):
    _logger.debug(f"Loading diarization model on device: {device}")

    try:
        if number_of_speakers:
            diarize_model = whisperx.diarize.DiarizationPipeline(  # type: ignore
                use_auth_token=settings.hf_token,
                device=device,
                min_speakers=number_of_speakers,  # type: ignore
                max_speakers=number_of_speakers,  # type: ignore
            )
        else:
            diarize_model = whisperx.diarize.DiarizationPipeline(
                use_auth_token=settings.hf_token, device=device
            )

        return diarize_model(audio)
    except Exception as e:
        if device == "cuda":
            _logger.warning(f"Diarization failed on GPU: {e}. Retrying on CPU")
            return _diarize_meeting(audio, "cpu", number_of_speakers)
        else:
            raise e


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


def _summarize_meeting(diarized_dialogue: str) -> str:
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
