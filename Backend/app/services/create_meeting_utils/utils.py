import time
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

        # Check if device is passed as positional argument and replace it
        if len(args) > 0:
            # Convert args to list to modify it
            args_list = list(args)
            # Find and replace device in args (only check string arguments)
            for i, arg in enumerate(args_list):
                if isinstance(arg, str) and arg == device:
                    args_list[i] = "cpu"
            args = tuple(args_list)

        # Also handle device in kwargs if present
        if "device" in kwargs:
            kwargs["device"] = "cpu"

        return function(*args, **kwargs)
    finally:
        clear_gpu_cache(device)


def clear_gpu_cache(device):
    if device == "cuda":
        torch.cuda.empty_cache()


def log_execution_time(function: Callable[..., Any], *args, **kwargs):
    start_time = time.time()
    result = function(*args, **kwargs)

    total_time = time.time() - start_time
    minutes, seconds = int(total_time // 60), int(total_time % 60)
    _logger.debug(f"{function.__name__.upper()} finished in {minutes}min {seconds}s")

    return result


def get_device():
    if not torch.cuda.is_available():
        _logger.info("CUDA not available, using CPU")
        return "cpu"

    gpu_name = torch.cuda.get_device_name(0)
    memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    _logger.info(f"GPU acceleration enabled - Using {gpu_name} - {memory_gb:.1f}GB)")
    return "cuda"
