from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import (
    AuthError,
    authenticate_user,
    issue_tokens,
    register_user,
)

router = APIRouter()


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        email_verified=user.email_verified,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new user and return access + refresh tokens."""
    try:
        user = await register_user(db, payload)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    tokens = issue_tokens(user)
    return TokenResponse(**tokens, user=_to_user_response(user))


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate and return access + refresh tokens."""
    try:
        user = await authenticate_user(db, payload.email, payload.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    tokens = issue_tokens(user)
    return TokenResponse(**tokens, user=_to_user_response(user))


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user."""
    return _to_user_response(current_user)
