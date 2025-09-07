from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.logging import setup_logger
from .routers import auth_router, conversation_router, meeting_router

_tags_metadata = [
    {"name": "Authentication", "description": "User authentication and registration"},
    {"name": "Meeting", "description": "Manage meetings"},
    {"name": "Conversations", "description": "Manage conversations"},
]


app = FastAPI(title="TFG", openapi_tags=_tags_metadata)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(meeting_router.router)
app.include_router(conversation_router.router)

_logger = setup_logger(__name__)
_logger.info("Backend is up")
