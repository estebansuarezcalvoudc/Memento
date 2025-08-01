import whisperx
import whisperx.diarize

from ...core.logging import log_execution_time, setup_logger
from ...core.settings import settings
from .gpu_utils import try_on_gpu

_logger = setup_logger(__name__)


@log_execution_time(_logger)
def get_transcribed_conversation(meeting, audio, device, compute_type, model_size):
    transcription = _transcribe_meeting(
        audio, meeting.language, device, compute_type, model_size
    )

    aligned = _align_meeting(transcription, audio, device)

    segments = _diarize_meeting(audio, device)

    diarized_conversation = _assign_word_speakers(segments, aligned)

    conversation = _create_diarized_dialogue(diarized_conversation)

    return conversation


@log_execution_time(_logger)
@try_on_gpu
def _transcribe_meeting(
    audio, language=None, device="cpu", compute_type="int8", model_size="tiny"
):
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


@log_execution_time(_logger)
@try_on_gpu
def _align_meeting(transcription, audio, device="cpu"):
    model_a, metadata = whisperx.load_align_model(language_code="es", device=device)

    return whisperx.align(
        transcription["segments"],
        model_a,
        metadata,
        audio,
        device,
        return_char_alignments=False,
    )


@log_execution_time(_logger)
@try_on_gpu
def _diarize_meeting(audio, device="cpu", number_of_speakers=None):
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


@log_execution_time(_logger)
def _assign_word_speakers(segments, aligned):
    return whisperx.assign_word_speakers(segments, aligned)


@log_execution_time(_logger)
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
