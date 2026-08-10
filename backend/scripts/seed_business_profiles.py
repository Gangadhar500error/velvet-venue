"""Seed sample business profiles linked to venue owners."""

from datetime import UTC, datetime

from sqlalchemy import func, select

from app.core.logging import get_logger
from app.models.business_profile import (
    BusinessDocumentStatus,
    BusinessProfile,
    BusinessProfileDocument,
    BusinessProfileStatus,
)
from app.repositories.business_profile_repository import BusinessProfileRepository
from app.repositories.user_repository import UserRepository
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.services.business_profile_service import DOCUMENT_SLOTS

logger = get_logger(__name__)

SAMPLES = [
    {
        "email": "vendor@velvetvenues.com",
        "business_name": "Velvet Celebrations",
        "legal_business_name": "Velvet Celebrations Pvt Ltd",
        "business_type": "Private Limited",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "gst_number": "36AABCV1234A1Z5",
        "pan_number": "AABCV1234A",
        "status": "active",
        "verification_status": "verified",
        "website": "https://velvetcelebrations.example.com",
        "years_in_business": 8,
        "support_email": "support@velvetcelebrations.example.com",
        "support_phone": "+919876543210",
        "ifsc_code": "HDFC0001234",
        "account_holder_name": "Velvet Celebrations Pvt Ltd",
        "bank_name": "HDFC Bank",
        "account_number": "50100234567890",
    },
    {
        "email": "priya.nair@example.com",
        "business_name": "Nair Banquets",
        "legal_business_name": "Nair Banquets",
        "business_type": "Proprietorship",
        "city": "Karimnagar",
        "state": "Telangana",
        "country": "India",
        "gst_number": "36AABCN9876B1Z2",
        "pan_number": "AABCN9876B",
        "status": "pending",
        "verification_status": "pending",
        "years_in_business": 3,
        "support_email": "hello@nairbanquets.example.com",
        "support_phone": "+919820155678",
    },
]


async def seed_business_profiles(session) -> None:
    repo = BusinessProfileRepository(session)
    owners = VenueOwnerRepository(session)
    users = UserRepository(session)

    existing_count = int(
        (
            await session.execute(select(func.count()).select_from(BusinessProfile))
        ).scalar_one()
        or 0
    )
    if existing_count >= 2:
        logger.info("Business profiles already seeded, skipped samples")
        return

    for sample in SAMPLES:
        user = await users.get_by_email(sample["email"])
        if user is None:
            logger.info("Skip business profile seed, user missing: %s", sample["email"])
            continue
        owner = await owners.get_by_user_id(user.id)
        if owner is None:
            logger.info("Skip business profile seed, owner missing: %s", sample["email"])
            continue

        existing_for_owner = await repo.count_by_venue_owner(owner.id)
        if existing_for_owner > 0:
            logger.info("Business profile already exists for %s", sample["email"])
            continue

        profile = BusinessProfile(
            tenant_id=owner.tenant_id,
            venue_owner_id=owner.id,
            business_code=await repo.next_business_code(),
            business_name=sample["business_name"],
            legal_business_name=sample["legal_business_name"],
            business_type=sample["business_type"],
            years_in_business=sample.get("years_in_business"),
            description=f"{sample['business_name']} — premium event spaces.",
            website=sample.get("website"),
            support_email=sample.get("support_email"),
            support_phone=sample.get("support_phone"),
            address_line1=f"12, {sample['city']} Residency",
            city=sample["city"],
            state=sample["state"],
            country=sample["country"],
            postal_code="500001",
            gst_number=sample.get("gst_number"),
            pan_number=sample.get("pan_number"),
            account_holder_name=sample.get("account_holder_name"),
            bank_name=sample.get("bank_name"),
            account_number=sample.get("account_number"),
            ifsc_code=sample.get("ifsc_code"),
            verification_status=sample["verification_status"],
            status=sample["status"],
            documents=[
                BusinessProfileDocument(
                    document_type=slot,
                    name=slot,
                    status=BusinessDocumentStatus.PENDING.value,
                )
                for slot in DOCUMENT_SLOTS
            ],
        )
        if sample["status"] == BusinessProfileStatus.ACTIVE.value:
            profile.published_at = datetime.now(UTC)

        await repo.create(profile)
        logger.info("Sample business profile created: %s", sample["business_name"])
