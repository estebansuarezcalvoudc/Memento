import time

from ..core.logging import setup_logger

_logger = setup_logger(__name__)

from typing import Any, Callable


def log_execution_time(function: Callable[..., Any], *args, **kwargs):
    start_time = time.time()
    result = function(*args, **kwargs)

    total_time = time.time() - start_time
    minutes, seconds = int(total_time // 60), int(total_time % 60)
    _logger.debug(f"{function.__name__.upper()} finished in {minutes}min {seconds}s")

    return result
