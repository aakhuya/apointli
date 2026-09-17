from datetime import datetime, timedelta, timezone

from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import RegisterRequest


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def register_user(db: AsyncSession, payload: RegisterRequest) -> User:
    email = payload.email.lower()

    existing = await get_user_by_email(db, email)
    if existing:
        raise AuthError("Email is already registered", status_code=409)

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise AuthError("Invalid email or password", status_code=401)

    if not user.is_active:
        raise AuthError("Account is disabled", status_code=403)

    return user


async def issue_tokens(
    db: AsyncSession,
    user: User,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> dict:
    """Create access + refresh tokens and persist the refresh token."""
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Persist hashed refresh token
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    record = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(record)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict:
    """Validate a refresh token and issue a new access + refresh pair (rotation)."""
    # 1. Decode the JWT
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise AuthError("Invalid or expired refresh token", status_code=401)

    if payload.get("type") != "refresh":
        raise AuthError("Invalid token type", status_code=401)

    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Invalid token payload", status_code=401)

    # 2. Look up the stored token
    token_hash = hash_refresh_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    record = result.scalar_one_or_none()

    if not record or record.revoked:
        raise AuthError("Refresh token has been revoked", status_code=401)

    if record.expires_at < datetime.now(timezone.utc):
        raise AuthError("Refresh token has expired", status_code=401)

    # 3. Get the user
    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise AuthError("User no longer active", status_code=401)

    # 4. Rotate: revoke the old token, issue new pair
    record.revoked = True
    await db.commit()

    return await issue_tokens(db, user)


async def revoke_refresh_token(db: AsyncSession, refresh_token: str) -> None:
    """Mark a refresh token as revoked (used for logout)."""
    token_hash = hash_refresh_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    record = result.scalar_one_or_none()
    if record:
        record.revoked = True
        await db.commit()
