import assemblyai as aai

aai.settings.api_key = "9bcb5c8f8e6a4757b23cfe64636a4c9c"

audio_file = "./Backend/data/audio_prueba.wav"

config = aai.TranscriptionConfig(
    speech_models=["universal-3-pro", "universal-2"],
    language_detection=True,
    speaker_labels=True,
)

transcript = aai.Transcriber(config=config).transcribe(audio_file)

if transcript.status == "error":
    raise RuntimeError(f"Transcription failed: {transcript.error}")

for utt in transcript.utterances:
    print(f"Speaker {utt.speaker}: {utt.text}")

print(transcript.language_code)
