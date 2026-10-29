from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import router as diet_router

app = FastAPI(
    title="The Legendary Lock-In API",
    description="Backend API for diet tracking (calories, protein, templates, and analytics)",
    version="0.1.0",
)

# CORS middleware for local frontend dev & preview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Diet Tracker Router
app.include_router(diet_router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to The Legendary Lock-In API",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "database": "connected" if settings.SUPABASE_DB_URL else "not_configured",
    }
