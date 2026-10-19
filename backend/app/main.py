from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import get_supabase
from app.config import settings

app = FastAPI(title="The Legendary Lock-In API", version="0.1.0")

# Setup CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to The Legendary Lock-In API",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/api/health")
def health_check():
    supabase = get_supabase()
    return {
        "status": "ok",
        "database": "configured" if supabase is not None else "credentials_pending",
    }
