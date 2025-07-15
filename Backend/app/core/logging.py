import logging
import os
import time


LOG_DIR = "./logs"
LOG_FILE = "app.log"

os.makedirs(LOG_DIR, exist_ok=True)


def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        log_path = os.path.join(LOG_DIR, LOG_FILE)
        file_handler = logging.FileHandler(log_path, mode="a", encoding="utf-8")

        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] - %(name)s - %(message)s",
            "%Y-%m-%d %H:%M:%S",
        )
        formatter.converter = lambda _: time.gmtime(time.time() + 2 * 3600)
        file_handler.setFormatter(formatter)

        logger.addHandler(file_handler)

    return logger
