from fastapi import APIRouter

from .models import router as models_router
from .providers import router as providers_router
from .templates import router as templates_router
from .whisperx import router as whisperx_router

# Main settings router
settings_router = APIRouter(prefix="/settings")

# Include all sub-routers
settings_router.include_router(providers_router)
settings_router.include_router(models_router)
settings_router.include_router(whisperx_router)
settings_router.include_router(templates_router)
