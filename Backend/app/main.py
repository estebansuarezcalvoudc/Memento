import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.logging import setup_logger
from .core.settings import settings
from .dependencies.service_dependencies import get_auth_service
from .routers.auth import auth_router
from .routers.conversation import conversation_router
from .routers.meeting import meeting_router
from .routers.settings import settings_router

_tags_metadata = [
    {"name": "Authentication", "description": "User authentication and registration"},
    {"name": "Meeting", "description": "Manage meetings"},
    {"name": "Conversations", "description": "Manage conversations"},
    {
        "name": "Settings - Providers",
        "description": "Manage LLM providers and API keys",
    },
    {"name": "Settings - Models", "description": "Manage model configurations"},
    {
        "name": "Settings - Transcription",
        "description": "Manage transcription configuration",
    },
    {
        "name": "Settings - Templates",
        "description": "Manage templates settings",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.account_purge_job_enabled:
        if settings.account_purge_job_interval_seconds <= 0:
            _logger.error(
                "Account purge job disabled: ACCOUNT_PURGE_JOB_INTERVAL_SECONDS must be greater than 0"
            )
        else:
            app.state.account_purge_task = asyncio.create_task(_purge_scheduler_loop())

    try:
        yield
    finally:
        task = getattr(app.state, "account_purge_task", None)
        if task is not None:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task


app = FastAPI(title="TFG", openapi_tags=_tags_metadata, lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://192.168.1.59:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(meeting_router)
app.include_router(conversation_router)
app.include_router(settings_router)

_logger = setup_logger(__name__)
_logger.info("Backend is up")


async def _purge_scheduler_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(get_auth_service().purge_accounts_due_for_deletion)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            _logger.error(f"Error running account purge job: {str(exc)}", exc_info=True)

        await asyncio.sleep(settings.account_purge_job_interval_seconds)
