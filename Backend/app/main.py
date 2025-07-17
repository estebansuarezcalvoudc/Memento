from fastapi import FastAPI

from .core.logging import setup_logger
from .routers import meeting

logger = setup_logger(__name__)

app = FastAPI()
app.include_router(meeting.router)

logger.info("Backend is up")
