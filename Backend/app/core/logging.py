import logging
import os
from datetime import datetime, timedelta, timezone

LOG_DIR = "./logs"
LOG_FILE = "app.log"

os.makedirs(LOG_DIR, exist_ok=True)


def custom_time(*args):
    tz = timezone(timedelta(hours=2))
    return datetime.now(tz).timetuple()


def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        log_path = os.path.join(LOG_DIR, LOG_FILE)
        file_handler = logging.FileHandler(log_path, mode="a", encoding="utf-8")

        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] - %(name)s - %(message)s",
            "%H:%M:%S",
        )
        formatter.converter = custom_time
        file_handler.setFormatter(formatter)

        logger.addHandler(file_handler)

    return logger
