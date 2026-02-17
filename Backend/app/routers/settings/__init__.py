from fastapi import APIRouter

from .models_router import router as models_router
from .providers_router import router as providers_router
from .templates_router import router as templates_router
from .whisperx_router import router as whisperx_router

# Main settings router
settings_router = APIRouter(prefix="/settings")

# Include all sub-routers
settings_router.include_router(providers_router)
settings_router.include_router(models_router)
settings_router.include_router(whisperx_router)
settings_router.include_router(templates_router)
