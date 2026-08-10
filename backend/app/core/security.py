import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

import bcrypt
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login")

TokenType = Literal["access", "refresh"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def _create_token(
    *,
    user_id: uuid.UUID | str,
    email: str,
    role: str,
    token_type: TokenType,
    expires_delta: timedelta,
) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "type": token_type,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(
    user_id: uuid.UUID | str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(
        user_id=user_id,
        email=email,
        role=role,
        token_type="access",
        expires_delta=expires_delta,
    )


def create_refresh_token(
    user_id: uuid.UUID | str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(
        user_id=user_id,
        email=email,
        role=role,
        token_type="refresh",
        expires_delta=expires_delta,
    )


def decode_token(token: str) -> Optional[dict[str, Any]]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[dict[str, Any]]:
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None
    return payload


def verify_refresh_token(token: str) -> Optional[dict[str, Any]]:
    payload = decode_token(token)
    if payload is None or payload.get("type") != "refresh":
        return None
    return payload
