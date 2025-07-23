from typing import Any, Callable

import torch

from ...core.logging import setup_logger

_logger = setup_logger(__name__)


def try_on_gpu(device, function: Callable[..., Any], *args, **kwargs):
    try:
        return function(*args, **kwargs)

    except Exception as e:
        if device != "cuda":
            raise e

        _logger.warning(
            f"{function.__name__.upper()} failed on GPU: {e}. Retrying on CPU"
        )

        args = _replace_device_in_args(args, device)
        kwargs = _replace_device_in_kwargs(kwargs)

        return function(*args, **kwargs)

    finally:
        clear_gpu_cache(device)


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
