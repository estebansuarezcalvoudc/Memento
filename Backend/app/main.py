from fastapi import FastAPI
from sqlmodel import SQLModel, create_engine, Session
from .routers import meeting
from .core.logging import setup_logger
from .core.config import settings


logger = setup_logger(__name__)

app = FastAPI()
app.include_router(meeting.router)

logger.info("Backend is up")
