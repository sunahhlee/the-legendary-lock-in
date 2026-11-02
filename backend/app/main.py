from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.config import settings
from app.db import engine
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
    """Health check. Runs a real query so pings count as DB activity
    (Supabase free tier pauses projects after ~7 days of inactivity)."""
    if engine is None:
        return {"status": "ok", "database": "not_configured"}
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503, content={"status": "degraded", "database": "unreachable"}
        )
