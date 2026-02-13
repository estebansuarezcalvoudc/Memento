from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.logging import setup_logger
from .routers import auth_router, conversation_router, meeting_router, settings_router

_tags_metadata = [
    {"name": "Authentication", "description": "User authentication and registration"},
    {"name": "Meeting", "description": "Manage meetings"},
    {"name": "Conversations", "description": "Manage conversations"},
    {"name": "Settings", "description": "User settings and configuration"},
]


app = FastAPI(title="TFG", openapi_tags=_tags_metadata)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://192.168.1.59:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(meeting_router.router)
app.include_router(conversation_router.router)
app.include_router(settings_router.router, prefix="/settings", tags=["Settings"])

_logger = setup_logger(__name__)
_logger.info("Backend is up")
