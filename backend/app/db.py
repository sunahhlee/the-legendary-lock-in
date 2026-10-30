from typing import Optional
from urllib.parse import urlparse
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


class Settings(BaseSettings):
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_DB_URL: Optional[str] = None
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    DEFAULT_USER_ID: str = "00000000-0000-0000-0000-000000000001"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Construct SQLAlchemy database URL safely from SUPABASE_DB_URL
engine = None
SessionLocal = None

if settings.SUPABASE_DB_URL:
    raw_url = settings.SUPABASE_DB_URL
    parsed = urlparse(raw_url)
    
    # Strip non-standard Supabase pooler query parameters for psycopg2 / SQLAlchemy
    clean_url = (
        f"postgresql+psycopg2://{parsed.username}:{parsed.password}@"
        f"{parsed.hostname}:{parsed.port or 6543}/{parsed.path.lstrip('/')}?sslmode=require"
    )
    
    engine = create_engine(
        clean_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency helper providing a database session per request."""
    if SessionLocal is None:
        raise RuntimeError("Database session factory is not configured. Check SUPABASE_DB_URL.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
