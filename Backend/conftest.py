"""Root conftest: register lightweight stubs for heavy ML/GPU packages.

Loaded by pytest before tests/conftest.py, so app.main can be imported
without CUDA-capable hardware or the full ML stack being installed.

``sys.modules.setdefault`` is used so that any module already present in
sys.modules (e.g. torch properly installed in a full dev environment that
was imported earlier) is left completely untouched.
"""

import sys
from unittest.mock import MagicMock

_HEAVY_MODULES = [
    "torch",
    "torch.cuda",
    "torchaudio",
    "whisperx",
    "whisperx.diarize",
    "transformers",
    "pyannote",
    "pyannote.audio",
    "faster_whisper",
]

for _mod in _HEAVY_MODULES:
    sys.modules.setdefault(_mod, MagicMock())
