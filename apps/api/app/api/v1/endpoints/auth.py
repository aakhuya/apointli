from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import (
    AuthError,
    authenticate_user,
    issue_tokens,
    refresh_access_token,
    register_user,
    revoke_refresh_token,
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


def _client_info(request: Request) -> tuple[str | None, str | None]:
    ua = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    return ua, ip


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    try:
        user = await register_user(db, payload)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    ua, ip = _client_info(request)
    tokens = await issue_tokens(db, user, user_agent=ua, ip_address=ip)
    return TokenResponse(**tokens, user=_to_user_response(user))


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    try:
        user = await authenticate_user(db, payload.email, payload.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    ua, ip = _client_info(request)
    tokens = await issue_tokens(db, user, user_agent=ua, ip_address=ip)
    return TokenResponse(**tokens, user=_to_user_response(user))


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> RefreshResponse:
    try:
        tokens = await refresh_access_token(db, payload.refresh_token)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return RefreshResponse(**tokens)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: LogoutRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await revoke_refresh_token(db, payload.refresh_token)
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return _to_user_response(current_user)
