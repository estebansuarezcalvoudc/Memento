from fastapi import FastAPI

from .core.logging import setup_logger
from .routers import chat_router, meeting_router

_tags_metadata = [
    {"name": "Meeting", "description": "Manage meetings"},
    {"name": "Chat", "description": "Send and receive messages"},
]


app = FastAPI(title="TFG", openapi_tags=_tags_metadata)
app.include_router(meeting_router.router)
app.include_router(chat_router.router)

_logger = setup_logger(__name__)
_logger.info("Backend is up")
