import time
from functools import wraps
from typing import Any, Callable

from ..core.logging import setup_logger

_logger = setup_logger(__name__)


def log_execution_time(function: Callable[..., Any]):
    """
    Decorator that logs the execution time of a function.

    Usage:
    @log_execution_time
    def my_function(args):
        # function implementation

    Args:
        function: The function to wrap
    """

    @wraps(function)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = function(*args, **kwargs)

        total_time = time.time() - start_time
        minutes, seconds = int(total_time // 60), int(total_time % 60)
        _logger.debug(
            f"{function.__name__.upper()} finished in {minutes}min {seconds}s"
        )

        return result

    return wrapper
