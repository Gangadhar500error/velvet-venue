import uuid
import secrets

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.role))
            .where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def get_by_mobile(self, mobile: str) -> User | None:
        cleaned = "".join(ch for ch in mobile if ch.isdigit() or ch == "+")
        if not cleaned:
            return None
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.role))
            .where(or_(User.mobile == cleaned, User.phone == cleaned))
        )
        return result.scalar_one_or_none()

    async def get_by_email_or_mobile(
        self, email: str | None = None, mobile: str | None = None
    ) -> User | None:
        if email:
            found = await self.get_by_email(email)
            if found:
                return found
        if mobile:
            return await self.get_by_mobile(mobile)
        return None

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User).options(selectinload(User.role)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        user.sync_derived_flags()
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user, attribute_names=["role"])
        return user

    async def update_password(self, user: User, password_hash: str) -> User:
        user.password_hash = password_hash
        await self.db.flush()
        return user

    @staticmethod
    def unusable_password_hash() -> str:
        """Hash for admin/vendor-created accounts pending activation."""
        return hash_password(secrets.token_urlsafe(32))

