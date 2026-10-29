from pydantic_settings import BaseSettings
from typing import Optional


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
