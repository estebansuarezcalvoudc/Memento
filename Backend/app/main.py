from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import meeting_router

app = FastAPI(
    title="Meeting Management API with HATEOAS",
    description="A FastAPI backend implementing HATEOAS (Hypermedia as the Engine of Application State)",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(meeting_router.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Meeting Management API with HATEOAS",
        "version": "1.0.0",
        "docs": "/docs",
        "api_prefix": "/api/v1"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}