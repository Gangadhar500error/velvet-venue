import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.role import RoleName
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository


class AuthRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)

    async def get_user_by_email(self, email: str) -> User | None:
        return await self.users.get_by_email(email.lower().strip())

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self.users.get_by_id(user_id)

    async def email_exists(self, email: str) -> bool:
        user = await self.get_user_by_email(email)
        return user is not None

    async def create_user(
        self,
        *,
        role_name: RoleName,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        phone: str | None = None,
    ) -> User:
        role = await self.roles.get_or_create(role_name)
        user = User(
            role_id=role.id,
            email=email.lower().strip(),
            password_hash=hash_password(password),
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            phone=phone,
            is_active=True,
            is_verified=False,
        )
        return await self.users.create(user)

    async def update_user_password(self, user: User, new_password: str) -> User:
        return await self.users.update_password(user, hash_password(new_password))
