import logging
import os
import time
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any, Callable

_LOG_DIR = "./logs"

os.makedirs(_LOG_DIR, exist_ok=True)


def setup_logger(name: str, log_file: str = "app.log") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        log_path = os.path.join(_LOG_DIR, log_file)
        file_handler = logging.FileHandler(log_path, mode="a", encoding="utf-8")

        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] - %(name)s - %(message)s",
            "%H:%M:%S",
        )
        formatter.converter = _custom_time
        file_handler.setFormatter(formatter)

        logger.addHandler(file_handler)

    return logger


def _custom_time(*args):
    tz = timezone(timedelta(hours=2))
    return datetime.now(tz).timetuple()


def log_execution_time(logger: logging.Logger):
    """
    Decorator that logs the execution time of a function using the provided logger.

    Usage:
    @log_execution_time(my_logger)
    def my_function(args):
        # function implementation

    Args:
        logger: The logger instance to use for logging execution time
    """

    def decorator(function: Callable[..., Any]):
        @wraps(function)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = function(*args, **kwargs)

            total_time = time.time() - start_time
            minutes, seconds = int(total_time // 60), int(total_time % 60)
            logger.debug(
                f"{function.__name__.upper()} finished in {minutes}min {seconds}s"
            )

            return result

        return wrapper

    return decorator
