"""Database seeder for roles and default users."""

import asyncio
import os

from app.core.logging import get_logger, setup_logging
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.role import RoleName
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from scripts.seed_business_profiles import seed_business_profiles
from scripts.seed_customers import seed_customers
from scripts.seed_permissions import run_rbac_seed
from scripts.seed_venue_owners import seed_venue_owners
from scripts.seed_venues import seed_venues

logger = get_logger(__name__)

DEFAULT_USERS = [
    {
        "role": RoleName.ADMIN,
        "email_env": "SEED_ADMIN_EMAIL",
        "password_env": "SEED_ADMIN_PASSWORD",
        "default_email": "admin@velvetvenues.com",
        "default_password": "Admin@123",
        "first_name": "Admin",
        "last_name": "User",
    },
    {
        "role": RoleName.VENDOR,
        "email_env": "SEED_VENDOR_EMAIL",
        "password_env": "SEED_VENDOR_PASSWORD",
        "default_email": "vendor@velvetvenues.com",
        "default_password": "Vendor@123",
        "first_name": "Vendor",
        "last_name": "User",
    },
    {
        "role": RoleName.CUSTOMER,
        "email_env": "SEED_CUSTOMER_EMAIL",
        "password_env": "SEED_CUSTOMER_PASSWORD",
        "default_email": "customer@velvetvenues.com",
        "default_password": "Customer@123",
        "first_name": "Customer",
        "last_name": "User",
    },
]


async def seed_roles(session) -> dict[RoleName, object]:
    role_repo = RoleRepository(session)
    roles = {}

    for role_name in RoleName:
        role = await role_repo.get_or_create(role_name)
        roles[role_name] = role
        logger.info("Role ready: %s", role_name.value)

    return roles


async def seed_users(session, roles: dict) -> None:
    user_repo = UserRepository(session)

    for entry in DEFAULT_USERS:
        email = os.getenv(entry["email_env"], entry["default_email"]).lower().strip()
        password = os.getenv(entry["password_env"], entry["default_password"])
        role = roles[entry["role"]]

        existing = await user_repo.get_by_email(email)
        if existing:
            existing.is_active = True
            existing.status = "active"
            existing.password_hash = hash_password(password)
            logger.info("User already exists, updated active status: %s", email)
            continue

        user = User(
            role_id=role.id,
            email=email,
            password_hash=hash_password(password),
            first_name=entry["first_name"],
            last_name=entry["last_name"],
            is_active=True,
            is_verified=True,
        )
        await user_repo.create(user)
        logger.info("User created: %s (%s)", email, entry["role"].value)


async def run_seed() -> None:
    setup_logging()
    logger.info("Starting database seed...")

    async with AsyncSessionLocal() as session:
        try:
            roles = await seed_roles(session)
            await run_rbac_seed(session)
            await seed_users(session, roles)
            await seed_customers(session)
            await seed_venue_owners(session)
            await seed_business_profiles(session)
            await seed_venues(session)
            await session.commit()
            logger.info("Database seed completed successfully")
        except Exception:
            await session.rollback()
            logger.exception("Database seed failed")
            raise


def main() -> None:
    asyncio.run(run_seed())


if __name__ == "__main__":
    main()
