from fastapi import FastAPI

from .core.logging import setup_logger
from .routers import auth_router, conversation_router, meeting_router

_tags_metadata = [
    {"name": "Authentication", "description": "User authentication and registration"},
    {"name": "Meeting", "description": "Manage meetings"},
    {"name": "Conversations", "description": "Manage conversations"},
]


app = FastAPI(title="TFG", openapi_tags=_tags_metadata)
app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(meeting_router.router)
app.include_router(conversation_router.router)

_logger = setup_logger(__name__)
_logger.info("Backend is up")
