from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest


class AuthError(Exception):
    """Raised for authentication-related failures."""

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
    """Create a new user after checking for existing email."""
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
    """Verify email + password and return the user, or raise AuthError."""
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise AuthError("Invalid email or password", status_code=401)

    if not user.is_active:
        raise AuthError("Account is disabled", status_code=403)

    return user


def issue_tokens(user: User) -> dict:
    """Create access + refresh tokens for a user."""
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }
