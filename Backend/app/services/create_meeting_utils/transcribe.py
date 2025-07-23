import whisperx
import whisperx.diarize

from ...core.config import settings
from .utils import log_execution_time, try_on_gpu


def get_transcribed_conversation(meeting, audio, device, compute_type, model_size):
    transcription = log_execution_time(
        _transcribe_meeting, audio, meeting.language, device, compute_type, model_size
    )

    aligned = log_execution_time(_align_meeting, transcription, audio, device)

    segments = log_execution_time(_diarize_meeting, audio, device)

    diarized_conversation = log_execution_time(
        whisperx.assign_word_speakers, segments, aligned
    )

    conversation = log_execution_time(_create_diarized_dialogue, diarized_conversation)

    return conversation


def _transcribe_meeting(
    audio, language=None, device="cpu", compute_type="int8", model_size="tiny"
):
    def _do_transcription(audio, language, device, compute_type, model_size):
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

    return try_on_gpu(
        device, _do_transcription, audio, language, device, compute_type, model_size
    )


def _align_meeting(transcription, audio, device="cpu"):
    def _do_alignment(transcription, audio, device):
        model_a, metadata = whisperx.load_align_model(language_code="es", device=device)

        return whisperx.align(
            transcription["segments"],
            model_a,
            metadata,
            audio,
            device,
            return_char_alignments=False,
        )

    return try_on_gpu(device, _do_alignment, transcription, audio, device)


def _diarize_meeting(audio, device="cpu", number_of_speakers=None):
    def _do_diarization(audio, device, number_of_speakers=None):
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

    return try_on_gpu(
        device, _do_diarization, audio, device, number_of_speakers=number_of_speakers
    )


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
