from typing import Optional
from supabase import create_client, Client
from app.config import settings

supabase_client: Optional[Client] = None

if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    try:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}")
        supabase_client = None


def get_supabase() -> Optional[Client]:
    """Dependency helper to get the initialized Supabase client."""
    return supabase_client
