from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient

from app.config import settings

security = HTTPBearer()


@lru_cache(maxsize=1)
def _jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(f"{url.rstrip('/')}/auth/v1/.well-known/jwks.json", cache_keys=True)


def _decode(token: str) -> dict:
    alg = jwt.get_unverified_header(token).get("alg")
    if alg == "HS256":
        if not settings.SUPABASE_JWT_SECRET:
            raise HTTPException(status_code=500, detail="JWT secret not configured")
        return jwt.decode(
            token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated"
        )
    if alg in ("ES256", "RS256"):
        if not settings.SUPABASE_URL:
            raise HTTPException(status_code=500, detail="SUPABASE_URL not configured")
        key = _jwks_client(settings.SUPABASE_URL).get_signing_key_from_jwt(token).key
        return jwt.decode(token, key, algorithms=[alg], audience="authenticated")
    raise jwt.InvalidTokenError(f"Unsupported alg: {alg}")


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    try:
        payload = _decode(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.InvalidTokenError, jwt.PyJWKClientError) as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing sub")
    return user_id
