from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role, RoleName


class RoleRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_name(self, name: RoleName) -> Role | None:
        result = await self.db.execute(select(Role).where(Role.name == name))
        return result.scalar_one_or_none()

    async def get_or_create(self, name: RoleName) -> Role:
        role = await self.get_by_name(name)
        if role is not None:
            return role

        role = Role(name=name)
        self.db.add(role)
        await self.db.flush()
        return role
