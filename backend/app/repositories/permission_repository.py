import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.permission import Menu, Permission
from app.models.role import Role
from app.models.user import User


class PermissionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_all_permissions(self) -> list[Permission]:
        result = await self.db.execute(select(Permission).order_by(Permission.module, Permission.action))
        return list(result.scalars().all())

    async def get_permission_by_code(self, code: str) -> Permission | None:
        result = await self.db.execute(select(Permission).where(Permission.code == code))
        return result.scalar_one_or_none()

    async def get_user_with_permissions(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(
                selectinload(User.role).selectinload(Role.permissions),
            )
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_role_permissions(self, role_id: uuid.UUID) -> list[Permission]:
        result = await self.db.execute(
            select(Permission)
            .join(Permission.roles)
            .where(Role.id == role_id)
            .order_by(Permission.module, Permission.action)
        )
        return list(result.scalars().all())

    async def get_menus_by_portal(self, portal: str) -> list[Menu]:
        result = await self.db.execute(
            select(Menu)
            .where(Menu.portal == portal, Menu.is_active.is_(True))
            .order_by(Menu.sort_order, Menu.label)
        )
        return list(result.scalars().all())

    async def upsert_permission(self, permission: Permission) -> Permission:
        existing = await self.get_permission_by_code(permission.code)
        if existing:
            return existing
        self.db.add(permission)
        await self.db.flush()
        return permission

    async def assign_permission_to_role(self, role: Role, permission: Permission) -> None:
        if permission not in role.permissions:
            role.permissions.append(permission)
            await self.db.flush()
