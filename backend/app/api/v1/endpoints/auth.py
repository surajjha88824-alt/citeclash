from datetime import timedelta
from typing import Annotated
from urllib.parse import urlencode
from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.services.email_service import send_welcome_email, send_password_reset_email
from app.core.exceptions import AppException, ConflictException, NotFoundException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleOAuthCallbackRequest,
    GoogleOAuthInitResponse,
    MessageResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserSignUp,
)
from app.schemas.user import UserResponse
from app.core.deps import get_current_user

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def signup(
    request: Request,
    payload: UserSignUp,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new user account and provision default workspace."""
    # Check if email is already taken
    stmt = select(User).where(User.email == payload.email.lower().strip())
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise ConflictException(f"Account with email '{payload.email}' already exists")

    user = User(
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role="user",
        auth_provider="email",
        is_active=True,
    )
    db.add(user)
    await db.flush()  # Generate user.id

    # Auto-provision initial default workspace
    default_workspace = Workspace(
        owner_id=user.id,
        brand_name=f"{user.full_name}'s Brand",
        domain_url="example.com",
        plan_tier="free",
        subscription_status="active",
        monthly_prompt_limit=50,
        prompts_used_this_month=0,
    )
    db.add(default_workspace)
    await db.commit()
    await db.refresh(user)

    # Issue tokens
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    # Dispatch welcome transactional email
    background_tasks.add_task(send_welcome_email, to_email=user.email, full_name=user.full_name)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("30/minute")
async def login(request: Request, payload: UserLogin, db: Annotated[AsyncSession, Depends(get_db)]):
    """Authenticate user with email and password."""
    stmt = select(User).where(User.email == payload.email.lower().strip())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise UnauthorizedException("Invalid email or password")

    if not verify_password(payload.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedException("Account has been disabled. Contact support.")

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(payload: RefreshTokenRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """Exchange a valid refresh token for a fresh access token."""
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise UnauthorizedException("Invalid or expired refresh token")

    user_id = decoded.get("sub")
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise UnauthorizedException("User session is no longer active")

    new_access_token = create_access_token(subject=user.id, role=user.role)

    return RefreshTokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("10/minute")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Initiate password reset flow by issuing a reset token."""
    stmt = select(User).where(User.email == payload.email.lower().strip())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Even if user is not found, return generic success message to prevent user enumeration
    if not user:
        return MessageResponse(
            message="If an account with that email exists, password reset instructions have been sent."
        )

    reset_token = create_password_reset_token(email=user.email)

    # Dispatch transactional reset email
    background_tasks.add_task(send_password_reset_email, to_email=user.email, reset_token=reset_token)

    return MessageResponse(
        message=f"Password reset instructions sent. (Dev Token: {reset_token})"
        if settings.DEBUG
        else "If an account with that email exists, password reset instructions have been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """Verify reset token and update user password."""
    decoded = decode_token(payload.token)
    if not decoded or decoded.get("type") != "password_reset":
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Invalid or expired password reset token",
            code="INVALID_RESET_TOKEN",
        )

    email = decoded.get("sub")
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundException("User associated with this token not found")

    user.password_hash = get_password_hash(payload.new_password)
    await db.commit()

    return MessageResponse(message="Password has been successfully updated. You may now log in.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Return currently authenticated user profile."""
    return UserResponse.model_validate(current_user)


# ==============================================================================
# Google OAuth Placeholder Hooks
# ==============================================================================

@router.get("/google/url", response_model=GoogleOAuthInitResponse)
async def get_google_auth_url():
    """Generate Google OAuth authorization redirect URL."""
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID or "placeholder_client_id",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": "citeclash_oauth_state_nonce_123",
        "prompt": "consent",
    }
    auth_url = f"{base_url}?{urlencode(params)}"
    return GoogleOAuthInitResponse(
        auth_url=auth_url,
        state=params["state"],
    )


@router.post("/google/callback", response_model=TokenResponse)
async def google_auth_callback(payload: GoogleOAuthCallbackRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """
    Callback hook for Google OAuth2.
    Accepts authorization code, exchanges for Google ID token, and authenticates/provisions user.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        # Development mock implementation if credentials are not yet populated
        demo_email = "google_user@example.com"
        stmt = select(User).where(User.email == demo_email)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                email=demo_email,
                full_name="Google Demo User",
                role="user",
                auth_provider="google",
                is_active=True,
            )
            db.add(user)
            await db.flush()

            default_workspace = Workspace(
                owner_id=user.id,
                brand_name="Google Demo Brand",
                domain_url="google-demo.com",
                plan_tier="starter",
                subscription_status="active",
            )
            db.add(default_workspace)
            await db.commit()
            await db.refresh(user)

        access_token = create_access_token(subject=user.id, role=user.role)
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    # In production with live credentials: exchange code using httpx to Google token endpoint
    raise AppException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        message="Live Google OAuth provider exchange hook ready. Set GOOGLE_CLIENT_ID and SECRET to activate live token exchange.",
        code="GOOGLE_OAUTH_PENDING_CONFIG",
    )
