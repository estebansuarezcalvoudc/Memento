from functools import wraps
from typing import Any, Callable

import torch

from ...core.logging import setup_logger

_logger = setup_logger(__name__, show_file_name=False)


def get_device():
    if not torch.cuda.is_available():
        _logger.info("CUDA not available, using CPU")
        return "cpu"

    gpu_name = torch.cuda.get_device_name(0)
    memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    _logger.info(f"GPU acceleration enabled - Using {gpu_name} - ({memory_gb:.1f}GB)")
    return "cuda"


def try_on_gpu(function: Callable[..., Any]):
    """
    Decorator that tries to execute a function on GPU and falls back to CPU on failure.

    Usage:
    @try_on_gpu
    def my_function(args, device="cuda"):
        # function implementation

    Args:
        function: The function to wrap
    """

    @wraps(function)
    def wrapper(*args, **kwargs):
        target_device = _get_target_device(function, args, kwargs)

        try:
            return function(*args, **kwargs)

        except Exception as e:
            if target_device != "cuda":
                raise e

            _logger.warning(
                f"{function.__name__.upper()} failed on GPU: {e}. Retrying on CPU"
            )

            new_args = _replace_device_in_args(args)
            new_kwargs = _replace_device_in_kwargs(kwargs)

            return function(*new_args, **new_kwargs)

        finally:
            _clear_gpu_cache(target_device)

    return wrapper


def _get_target_device(function, args, kwargs):
    target_device = kwargs.get("device")

    if not target_device:
        for arg in args:
            if isinstance(arg, str) and arg in ("cuda", "cpu"):
                target_device = arg
                break

    if not target_device:
        raise ValueError(
            f"Function {function.__name__} should receive an argument named <device>"
        )

    if target_device != "cpu" and target_device != "cuda":
        raise ValueError(
            f"Argument device in function {function.__name__} should be <cuda> or <cpu>"
        )

    return target_device


def _replace_device_in_args(args: tuple) -> tuple:
    return tuple(
        "cpu" if isinstance(arg, str) and arg == "cuda" else arg for arg in args
    )


def _replace_device_in_kwargs(kwargs: dict) -> dict:
    if "device" in kwargs:
        kwargs["device"] = "cpu"

    return kwargs


def _clear_gpu_cache(device):
    if device == "cuda":
        torch.cuda.empty_cache()
