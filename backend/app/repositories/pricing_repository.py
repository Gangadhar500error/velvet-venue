import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.business_profile import BusinessProfile
from app.models.venue import Venue, VenueFoodSlot, VenuePricing, VenueSlot


class PricingRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _options(self):
        return [
            selectinload(VenuePricing.slots),
            selectinload(VenuePricing.food_slots),
            selectinload(VenuePricing.venue).selectinload(Venue.business_profile).selectinload(
                BusinessProfile.venue_owner
            ),
        ]

    async def get_by_id(self, pricing_id: uuid.UUID) -> VenuePricing | None:
        result = await self.db.execute(
            select(VenuePricing)
            .options(*self._options())
            .where(VenuePricing.id == pricing_id, VenuePricing.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_for_venue(self, venue_id: uuid.UUID) -> list[VenuePricing]:
        result = await self.db.execute(
            select(VenuePricing)
            .options(*self._options())
            .where(VenuePricing.venue_id == venue_id, VenuePricing.deleted_at.is_(None))
            .order_by(VenuePricing.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def add(self, pricing: VenuePricing) -> VenuePricing:
        self.db.add(pricing)
        await self.db.flush()
        await self.db.refresh(pricing)
        return pricing

    async def soft_delete(self, pricing: VenuePricing) -> VenuePricing:
        now = datetime.now(UTC)
        pricing.deleted_at = now
        pricing.is_active = False
        await self.db.flush()
        return pricing


class SlotRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, slot_id: uuid.UUID) -> VenueSlot | None:
        result = await self.db.execute(
            select(VenueSlot)
            .options(
                selectinload(VenueSlot.pricing).selectinload(VenuePricing.venue).selectinload(
                    Venue.business_profile
                ).selectinload(BusinessProfile.venue_owner)
            )
            .where(VenueSlot.id == slot_id, VenueSlot.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def add(self, slot: VenueSlot) -> VenueSlot:
        self.db.add(slot)
        await self.db.flush()
        await self.db.refresh(slot)
        return slot

    async def soft_delete(self, slot: VenueSlot) -> VenueSlot:
        slot.deleted_at = datetime.now(UTC)
        slot.enabled = False
        await self.db.flush()
        return slot

    async def next_display_order(self, pricing_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(VenueSlot.display_order)
            .where(
                VenueSlot.venue_pricing_id == pricing_id,
                VenueSlot.deleted_at.is_(None),
            )
            .order_by(VenueSlot.display_order.desc())
            .limit(1)
        )
        current = result.scalar_one_or_none()
        return int(current or 0) + 1


class FoodSlotRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, food_slot_id: uuid.UUID) -> VenueFoodSlot | None:
        result = await self.db.execute(
            select(VenueFoodSlot)
            .options(
                selectinload(VenueFoodSlot.pricing)
                .selectinload(VenuePricing.venue)
                .selectinload(Venue.business_profile)
                .selectinload(BusinessProfile.venue_owner)
            )
            .where(
                VenueFoodSlot.id == food_slot_id,
                VenueFoodSlot.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def add(self, slot: VenueFoodSlot) -> VenueFoodSlot:
        self.db.add(slot)
        await self.db.flush()
        await self.db.refresh(slot)
        return slot

    async def soft_delete(self, slot: VenueFoodSlot) -> VenueFoodSlot:
        slot.deleted_at = datetime.now(UTC)
        slot.enabled = False
        await self.db.flush()
        return slot

    async def next_display_order(self, pricing_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(VenueFoodSlot.display_order)
            .where(
                VenueFoodSlot.venue_pricing_id == pricing_id,
                VenueFoodSlot.deleted_at.is_(None),
            )
            .order_by(VenueFoodSlot.display_order.desc())
            .limit(1)
        )
        current = result.scalar_one_or_none()
        return int(current or 0) + 1
