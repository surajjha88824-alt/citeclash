from typing import Annotated, Optional
from fastapi import Depends, Header, Path, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, NotFoundException, UnauthorizedException
from app.core.security import decode_token
from app.models.user import User
from app.models.workspace import Workspace

security = HTTPBearer(auto_error=False)


async def get_current_user(
    auth_header: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Validate JWT access token and return authenticated User."""
    if not auth_header or not auth_header.credentials:
        raise UnauthorizedException("Authentication token is missing")

    token = auth_header.credentials
    payload = decode_token(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired authentication token")

    token_type = payload.get("type")
    if token_type != "access":
        raise UnauthorizedException("Invalid token type. Access token required")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token payload missing user identifier")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User associated with this token no longer exists")

    if not user.is_active:
        raise ForbiddenException("User account has been deactivated")

    return user


async def get_current_super_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Enforce that authenticated user has super_admin role."""
    if current_user.role != "super_admin":
        raise ForbiddenException("Administrator privileges required for this action")
    return current_user


async def get_workspace_for_user(
    workspace_id: Annotated[str, Path(..., description="The ID of the workspace")],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Workspace:
    """
    Strict ownership dependency:
    Ensures that the requested workspace exists AND belongs to the authenticated user.
    Super-admins are granted access for operational/support needs.
    """
    stmt = select(Workspace).where(Workspace.id == workspace_id)
    result = await db.execute(stmt)
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise NotFoundException(f"Workspace with ID '{workspace_id}' not found")

    # Strict ownership verification
    if workspace.owner_id != current_user.id and current_user.role != "super_admin":
        raise ForbiddenException("Access denied. You do not have permission to access this workspace")

    return workspace
