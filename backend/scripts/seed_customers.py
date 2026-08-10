"""Seed sample customers linked to users (auth identity)."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.customer import (
    Customer,
    CustomerStatus,
    RegistrationSource,
    VerificationStatus,
)
from app.models.role import Role, RoleName
from app.models.user import User
from app.repositories.customer_repository import CustomerRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.services.customer_service import CustomerService

logger = get_logger(__name__)

SAMPLE_CUSTOMERS = [
    {
        "first_name": "Aarav",
        "last_name": "Sharma",
        "email": "aarav.sharma@example.com",
        "mobile": "+919876543210",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "postal_code": "500032",
        "address_line1": "12 Jubilee Hills Road",
        "gender": "male",
        "registration_source": RegistrationSource.WEBSITE.value,
        "verification_status": VerificationStatus.VERIFIED.value,
        "email_verified": True,
        "mobile_verified": True,
        "status": CustomerStatus.ACTIVE.value,
    },
    {
        "first_name": "Diya",
        "last_name": "Patel",
        "email": "diya.patel@example.com",
        "mobile": "+919812345678",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "postal_code": "560001",
        "address_line1": "88 MG Road",
        "gender": "female",
        "registration_source": RegistrationSource.ADMIN.value,
        "verification_status": VerificationStatus.PENDING.value,
        "email_verified": False,
        "mobile_verified": True,
        "status": CustomerStatus.ACTIVE.value,
    },
    {
        "first_name": "Rohan",
        "last_name": "Verma",
        "email": "rohan.verma@example.com",
        "mobile": "+919900112233",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "country": "India",
        "postal_code": "600002",
        "address_line1": "45 Anna Salai",
        "gender": "male",
        "registration_source": RegistrationSource.VENDOR.value,
        "verification_status": VerificationStatus.VERIFIED.value,
        "email_verified": True,
        "mobile_verified": False,
        "status": CustomerStatus.ACTIVE.value,
    },
]


async def _ensure_user_for_customer(session, entry: dict, role: Role) -> User:
    users = UserRepository(session)
    existing = await users.get_by_email_or_mobile(
        email=entry["email"], mobile=entry["mobile"]
    )
    if existing:
        return existing

    user = User(
        role_id=role.id,
        email=entry["email"],
        password_hash=UserRepository.unusable_password_hash(),
        first_name=entry["first_name"],
        last_name=entry["last_name"],
        full_name=f"{entry['first_name']} {entry['last_name']}",
        phone=entry["mobile"],
        mobile=entry["mobile"],
        email_verified=entry["email_verified"],
        mobile_verified=entry["mobile_verified"],
        status="active",
        is_active=True,
        is_verified=entry["email_verified"],
    )
    return await users.create(user)


async def seed_customers(session) -> None:
    repo = CustomerRepository(session)
    service = CustomerService(session)
    role_repo = RoleRepository(session)
    customer_role = await role_repo.get_or_create(RoleName.CUSTOMER)

    result = await session.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == "customer@velvetvenues.com")
    )
    default_user = result.scalar_one_or_none()
    if default_user:
        await service.ensure_customer_for_user(
            default_user,
            registration_source=RegistrationSource.WEBSITE.value,
        )
        logger.info("Linked customer profile for customer@velvetvenues.com")

    # Backfill any orphan customer rows without user_id
    orphans = await session.execute(
        select(Customer).where(Customer.user_id.is_(None), Customer.deleted_at.is_(None))
    )
    for orphan in orphans.scalars().all():
        user = await _ensure_user_for_customer(
            session,
            {
                "email": orphan.email,
                "mobile": orphan.mobile,
                "first_name": orphan.first_name,
                "last_name": orphan.last_name,
                "email_verified": orphan.email_verified,
                "mobile_verified": orphan.mobile_verified,
            },
            customer_role,
        )
        orphan.user_id = user.id
        logger.info("Backfilled user link for customer %s", orphan.customer_code)

    count = await session.scalar(select(func.count()).select_from(Customer))
    if count and count > 1:
        logger.info("Customers already seeded, skipped samples")
        return

    for entry in SAMPLE_CUSTOMERS:
        existing = await repo.find_by_email_or_mobile(
            email=entry["email"], mobile=entry["mobile"]
        )
        if existing:
            if existing.user_id is None:
                user = await _ensure_user_for_customer(session, entry, customer_role)
                existing.user_id = user.id
            continue

        user = await _ensure_user_for_customer(session, entry, customer_role)
        customer = Customer(
            id=uuid.uuid4(),
            user_id=user.id,
            customer_code=await repo.next_customer_code(),
            first_name=entry["first_name"],
            last_name=entry["last_name"],
            full_name=f"{entry['first_name']} {entry['last_name']}",
            email=entry["email"],
            mobile=entry["mobile"],
            city=entry["city"],
            state=entry["state"],
            country=entry["country"],
            postal_code=entry["postal_code"],
            address_line1=entry["address_line1"],
            gender=entry["gender"],
            registration_source=entry["registration_source"],
            customer_type="individual",
            verification_status=entry["verification_status"],
            email_verified=entry["email_verified"],
            mobile_verified=entry["mobile_verified"],
            status=entry["status"],
        )
        await repo.create(customer)
        logger.info("Sample customer+user created: %s", entry["email"])
