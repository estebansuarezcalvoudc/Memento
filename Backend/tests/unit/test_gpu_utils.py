"""
Unit tests for gpu_utils: CPU fallback logic and compute_type replacement.
"""

import pytest

from app.services.meeting.meeting_processing.gpu_utils import (
    _replace_for_cpu_fallback,
    try_on_gpu,
)


def _sample_transcribe(self_arg, audio, language=None, device="cpu", compute_type="int8", model_size="tiny"):
    return (device, compute_type)


# ---------------------------------------------------------------------------
# _replace_for_cpu_fallback
# ---------------------------------------------------------------------------


class TestReplaceForCpuFallback:
    def test_replace_for_cpu_fallback_should_replace_cuda_device_in_positional_args(self):
        args = (object(), "audio", None, "cuda", "int8", "tiny")

        new_args, _ = _replace_for_cpu_fallback(_sample_transcribe, args, {})

        assert new_args[3] == "cpu"

    def test_replace_for_cpu_fallback_should_replace_float16_with_int8_in_positional_args(self):
        args = (object(), "audio", None, "cuda", "float16", "tiny")

        new_args, _ = _replace_for_cpu_fallback(_sample_transcribe, args, {})

        assert new_args[4] == "int8"

    def test_replace_for_cpu_fallback_should_replace_float32_with_int8_in_positional_args(self):
        args = (object(), "audio", None, "cuda", "float32", "tiny")

        new_args, _ = _replace_for_cpu_fallback(_sample_transcribe, args, {})

        assert new_args[4] == "int8"

    def test_replace_for_cpu_fallback_should_not_alter_int8_compute_type(self):
        args = (object(), "audio", None, "cuda", "int8", "tiny")

        new_args, _ = _replace_for_cpu_fallback(_sample_transcribe, args, {})

        assert new_args[4] == "int8"

    def test_replace_for_cpu_fallback_should_not_alter_unrelated_positional_args(self):
        args = (object(), "audio_data", "en", "cuda", "float16", "large-v3")

        new_args, _ = _replace_for_cpu_fallback(_sample_transcribe, args, {})

        assert new_args[1] == "audio_data"
        assert new_args[2] == "en"
        assert new_args[5] == "large-v3"

    def test_replace_for_cpu_fallback_should_replace_cuda_device_in_kwargs(self):
        kwargs = {"device": "cuda", "compute_type": "int8"}

        _, new_kwargs = _replace_for_cpu_fallback(_sample_transcribe, (object(),), kwargs)

        assert new_kwargs["device"] == "cpu"

    def test_replace_for_cpu_fallback_should_replace_float16_with_int8_in_kwargs(self):
        kwargs = {"device": "cuda", "compute_type": "float16"}

        _, new_kwargs = _replace_for_cpu_fallback(_sample_transcribe, (object(),), kwargs)

        assert new_kwargs["compute_type"] == "int8"

    def test_replace_for_cpu_fallback_should_replace_float32_with_int8_in_kwargs(self):
        kwargs = {"device": "cuda", "compute_type": "float32"}

        _, new_kwargs = _replace_for_cpu_fallback(_sample_transcribe, (object(),), kwargs)

        assert new_kwargs["compute_type"] == "int8"


# ---------------------------------------------------------------------------
# try_on_gpu decorator
# ---------------------------------------------------------------------------


class TestTryOnGpu:
    def test_try_on_gpu_should_return_result_when_gpu_succeeds(self):
        @try_on_gpu
        def func(device="cpu", compute_type="int8"):
            return (device, compute_type)

        result = func(device="cuda", compute_type="float16")

        assert result == ("cuda", "float16")

    def test_try_on_gpu_should_fall_back_to_cpu_with_int8_when_cuda_fails(self):
        received_args = []

        @try_on_gpu
        def func(device="cpu", compute_type="int8"):
            received_args.append((device, compute_type))
            if device == "cuda":
                raise RuntimeError("CUDA out of memory")
            return (device, compute_type)

        result = func(device="cuda", compute_type="float16")

        assert received_args == [("cuda", "float16"), ("cpu", "int8")]
        assert result == ("cpu", "int8")

    def test_try_on_gpu_should_reset_float32_to_int8_on_cpu_fallback(self):
        received_args = []

        @try_on_gpu
        def func(device="cpu", compute_type="int8"):
            received_args.append((device, compute_type))
            if device == "cuda":
                raise RuntimeError("GPU error")
            return (device, compute_type)

        result = func(device="cuda", compute_type="float32")

        assert received_args[1] == ("cpu", "int8")
        assert result == ("cpu", "int8")

    def test_try_on_gpu_should_not_retry_when_device_is_already_cpu(self):
        @try_on_gpu
        def func(device="cpu", compute_type="int8"):
            raise ValueError("CPU error")

        with pytest.raises(ValueError, match="CPU error"):
            func(device="cpu", compute_type="int8")

    def test_try_on_gpu_should_call_function_exactly_twice_on_cuda_failure(self):
        call_count = [0]

        @try_on_gpu
        def func(device="cpu", compute_type="int8"):
            call_count[0] += 1
            if device == "cuda":
                raise RuntimeError("GPU error")
            return "ok"

        func(device="cuda", compute_type="int8")

        assert call_count[0] == 2

    def test_try_on_gpu_should_raise_value_error_when_device_argument_is_missing(self):
        @try_on_gpu
        def func(audio, model):
            return audio

        with pytest.raises(ValueError, match="should receive an argument named <device>"):
            func("audio_data", "tiny")
