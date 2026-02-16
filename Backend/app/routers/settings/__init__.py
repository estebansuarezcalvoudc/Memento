from fastapi import APIRouter

from .providers import router as providers_router

# Main settings router
settings_router = APIRouter(prefix="/settings")

# Include all sub-routers
settings_router.include_router(providers_router)
