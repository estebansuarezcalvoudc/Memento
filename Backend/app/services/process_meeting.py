import whisperx
import gc
import torch
import os
import tempfile
from dotenv import load_dotenv
from ..core.logging import setup_logger
from ..core.config import settings

logger = setup_logger(__name__)


def process_audio_from_bytes(audio_bytes):
    # Crear un archivo temporal solo para whisperx.load_audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(audio_bytes)
        temp_file_path = temp_file.name

    try:
        audio = whisperx.load_audio(temp_file_path)
        return _process_audio_data(audio)
    finally: # Limpiar el archivo temporal
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def _process_audio_data(audio):
    transcription = _transcribe_audio(audio)
    logger.info(f"Audio has been transcribed")

    aligned_transcription = _align_audio_and_transcription(audio, transcription)
    logger.info("Audio has been aligned")

    diarized_segments = _diarize_conversation(audio)
    logger.info("Audio has been diarized")

    diarized_conversation = whisperx.assign_word_speakers(
        diarized_segments, aligned_transcription
    )

    logger.info("Diarized conversation has been created")

    return _format_output(diarized_conversation)


def _transcribe_audio(audio):
    model = whisperx.load_model("tiny", "cpu", language="es", compute_type="int8")

    transcription = model.transcribe(audio, batch_size=10)

    gc.collect()
    torch.cuda.empty_cache()
    del model

    return transcription


def _align_audio_and_transcription(audio, transcription):
    model_a, metadata = whisperx.load_align_model(language_code="es", device="cpu")
    return whisperx.align(
        transcription["segments"],
        model_a,
        metadata,
        audio,
        "cpu",
        return_char_alignments=False,
    )


def _diarize_conversation(audio):
    load_dotenv()

    diarize_model = whisperx.diarize.DiarizationPipeline(
        settings.hf_token, device="cpu"
    )

    return diarize_model(audio)


def _format_output(diarized_conversation):
    segments = diarized_conversation["segments"]
    current_speaker = None
    conversation = ""

    for segment in segments:
        speaker = segment.get("speaker", "Unknown")
        text = segment.get("text", "")
        if speaker != current_speaker:
            if conversation:
                conversation += "\n\n\n"
            conversation += f"{speaker}:\n    {text.strip()}"
            current_speaker = speaker
        else:
            conversation += f" {text.strip()}"

    return conversation
