from functools import wraps
from typing import Any, Callable

import torch

from ...core.logging import setup_logger

_logger = setup_logger(__name__)


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
        target_device = kwargs.get("device") or get_device()

        try:
            return function(*args, **kwargs)

        except Exception as e:
            if target_device != "cuda":
                raise e

            _logger.warning(
                f"{function.__name__.upper()} failed on GPU: {e}. Retrying on CPU"
            )

            new_args = _replace_device_in_args(args, target_device)
            new_kwargs = _replace_device_in_kwargs(kwargs)

            return function(*new_args, **new_kwargs)

        finally:
            clear_gpu_cache(target_device)

    return wrapper


def _replace_device_in_args(args: tuple, device) -> tuple:
    if len(args) > 0:
        args_list = list(args)

        for i, arg in enumerate(args_list):
            if isinstance(arg, str) and arg == device:
                args_list[i] = "cpu"

        args = tuple(args_list)

    return args


def _replace_device_in_kwargs(kwargs: dict) -> dict:
    if "device" in kwargs:
        kwargs["device"] = "cpu"

    return kwargs


def clear_gpu_cache(device):
    if device == "cuda":
        torch.cuda.empty_cache()


def get_device():
    if not torch.cuda.is_available():
        _logger.info("CUDA not available, using CPU")
        return "cpu"

    gpu_name = torch.cuda.get_device_name(0)
    memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    _logger.info(f"GPU acceleration enabled - Using {gpu_name} - {memory_gb:.1f}GB)")
    return "cuda"
