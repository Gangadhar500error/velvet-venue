from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.services.permission_service import PermissionService


def get_permission_service(db: AsyncSession = Depends(get_db)) -> PermissionService:
    return PermissionService(db)


def require_permission(*permission_codes: str, require_all: bool = True) -> Callable:
    """Reusable dependency — attach to any route that needs RBAC enforcement."""

    async def permission_checker(
        current_user: Annotated[User, Depends(get_current_active_user)],
        permission_service: Annotated[PermissionService, Depends(get_permission_service)],
    ) -> User:
        if require_all:
            allowed = await permission_service.user_has_all_permissions(
                current_user, *permission_codes
            )
        else:
            allowed = await permission_service.user_has_any_permission(
                current_user, *permission_codes
            )

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return permission_checker
