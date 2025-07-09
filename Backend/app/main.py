from fastapi import FastAPI
from .routers import meeting
from .core.logging import setup_logger

logger = setup_logger(__name__)

app = FastAPI()
app.include_router(meeting.router)

logger.info("Backend is up")
