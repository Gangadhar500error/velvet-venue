"""Seed sample venue owners linked to vendor users."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.role import RoleName
from app.models.user import User
from app.models.venue_owner import (
    VenueOwner,
    VenueOwnerRegistrationSource,
    VenueOwnerStatus,
    VenueOwnerVerificationStatus,
)
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.services.venue_owner_service import VenueOwnerService

logger = get_logger(__name__)

SAMPLES = [
    {
        "first_name": "Priya",
        "last_name": "Nair",
        "email": "priya.nair@example.com",
        "mobile": "+919811122233",
        "business_name": "Nair Celebrations",
        "business_type": "Banquet Hall",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "postal_code": "500034",
        "address_line1": "Road No. 12, Banjara Hills",
        "status": VenueOwnerStatus.ACTIVE.value,
        "verification_status": VenueOwnerVerificationStatus.VERIFIED.value,
        "registration_source": VenueOwnerRegistrationSource.WEBSITE.value,
    },
    {
        "first_name": "Karan",
        "last_name": "Mehta",
        "email": "karan.mehta@example.com",
        "mobile": "+919822233344",
        "business_name": "Mehta Events Co",
        "business_type": "Wedding Venue",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "postal_code": "560038",
        "address_line1": "100 Indiranagar 100 Feet Rd",
        "status": VenueOwnerStatus.PENDING.value,
        "verification_status": VenueOwnerVerificationStatus.PENDING.value,
        "registration_source": VenueOwnerRegistrationSource.ADMIN.value,
    },
]


async def seed_venue_owners(session) -> None:
    repo = VenueOwnerRepository(session)
    service = VenueOwnerService(session)
    roles = RoleRepository(session)
    users = UserRepository(session)
    vendor_role = await roles.get_or_create(RoleName.VENDOR)

    # Link default seeded vendor user
    result = await session.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == "vendor@velvetvenues.com")
    )
    default_vendor = result.scalar_one_or_none()
    if default_vendor:
        await service.ensure_owner_for_user(
            default_vendor,
            registration_source=VenueOwnerRegistrationSource.WEBSITE.value,
            business_name="Velvet Demo Venues",
        )
        logger.info("Linked venue owner profile for vendor@velvetvenues.com")

    count = await session.scalar(select(func.count()).select_from(VenueOwner))
    if count and count > 1:
        logger.info("Venue owners already seeded, skipped samples")
        return

    for entry in SAMPLES:
        existing = await repo.find_by_email_or_mobile(
            email=entry["email"], mobile=entry["mobile"]
        )
        if existing:
            continue

        user = await users.get_by_email_or_mobile(
            email=entry["email"], mobile=entry["mobile"]
        )
        if user is None:
            user = User(
                role_id=vendor_role.id,
                email=entry["email"],
                password_hash=UserRepository.unusable_password_hash(),
                first_name=entry["first_name"],
                last_name=entry["last_name"],
                full_name=f"{entry['first_name']} {entry['last_name']}",
                phone=entry["mobile"],
                mobile=entry["mobile"],
                status="active" if entry["status"] == "active" else "inactive",
                is_active=entry["status"] == "active",
            )
            user = await users.create(user)

        owner = VenueOwner(
            id=uuid.uuid4(),
            user_id=user.id,
            owner_code=await repo.next_owner_code(),
            first_name=entry["first_name"],
            last_name=entry["last_name"],
            full_name=f"{entry['first_name']} {entry['last_name']}",
            email=entry["email"],
            mobile=entry["mobile"],
            business_name=entry["business_name"],
            business_type=entry["business_type"],
            city=entry["city"],
            state=entry["state"],
            country=entry["country"],
            postal_code=entry["postal_code"],
            address_line1=entry["address_line1"],
            status=entry["status"],
            verification_status=entry["verification_status"],
            registration_source=entry["registration_source"],
        )
        await repo.create(owner)
        logger.info("Sample venue owner created: %s", entry["email"])
