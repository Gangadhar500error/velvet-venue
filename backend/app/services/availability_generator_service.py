from __future__ import annotations

import uuid
from datetime import date, timedelta

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.availability import (
    AvailabilityStatus,
    BlockReason,
    VenueAvailability,
    VenueSlotAvailability,
)
from app.models.venue import Venue, VenueFoodSlot, VenuePricing, VenueSlot, VenueStatus
from app.repositories.availability_repository import (
    AvailabilityBlockRepository,
    AvailabilityLogRepository,
    AvailabilityRepository,
    AvailabilitySlotRepository,
)
from app.repositories.venue_repository import VenueRepository
from app.utils.availability_dates import block_matches_date, iter_dates, parse_weekly_off

PROTECTED_SLOT_STATUSES = {
    AvailabilityStatus.BOOKED.value,
    AvailabilityStatus.COMPLETED.value,
}
MUTABLE_SLOT_STATUSES = {
    AvailabilityStatus.AVAILABLE.value,
    AvailabilityStatus.BLOCKED.value,
    AvailabilityStatus.HOLIDAY.value,
    AvailabilityStatus.CLOSED.value,
    AvailabilityStatus.NO_BOOKING.value,
    AvailabilityStatus.EXPIRED.value,
    AvailabilityStatus.CANCELLED.value,
}


class AvailabilityGeneratorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.venues = VenueRepository(db)
        self.days = AvailabilityRepository(db)
        self.slots = AvailabilitySlotRepository(db)
        self.blocks = AvailabilityBlockRepository(db)
        self.logs = AvailabilityLogRepository(db)

    async def generate_for_venue(
        self,
        venue_id: uuid.UUID,
        *,
        performed_by: uuid.UUID | None = None,
        today: date | None = None,
        fill_missing_only: bool = False,
    ) -> int:
        await self.db.flush()
        venue = await self.venues.get_by_id(venue_id)
        if venue is None:
            return 0
        today = today or date.today()
        pricing = venue.active_pricing()
        window_days = int(getattr(pricing, "booking_window_days", None) or 180)
        window_end = today + timedelta(days=max(window_days, 0))
        templates = self._templates(pricing)
        weekly_off = parse_weekly_off(venue.weekly_off)
        blocks = await self.blocks.list_active(venue.id, today, window_end)

        existing_dates = await self.days.dates_in_range(venue.id, today, window_end)
        missing = [
            {
                "id": uuid.uuid4(),
                "venue_id": venue.id,
                "availability_date": day,
                "status": AvailabilityStatus.AVAILABLE.value,
                "available_capacity": 0,
                "booked_capacity": 0,
                "generated": True,
                "is_manual_override": False,
            }
            for day in iter_dates(today, window_end)
            if day not in existing_dates
        ]
        created = len(missing)
        if missing:
            stmt = (
                pg_insert(VenueAvailability)
                .values(missing)
                .on_conflict_do_nothing(constraint="uq_venue_availability_date")
            )
            await self.db.execute(stmt)
            await self.db.flush()

        if fill_missing_only and created == 0:
            return 0

        if not fill_missing_only:
            beyond = await self.days.list_after(venue.id, window_end)
            for row in beyond:
                if row.availability_date < today:
                    continue
                self._expire_future_outside_window(row)

        rows = await self.days.list_range(venue.id, today, window_end)
        if fill_missing_only:
            rows = [row for row in rows if row.availability_date not in existing_dates]
        for row in rows:
            await self._sync_day(
                venue,
                row,
                templates=templates,
                weekly_off=weekly_off,
                blocks=blocks,
                today=today,
                window_end=window_end,
                performed_by=performed_by,
            )
        await self.db.flush()
        return created

    def _templates(self, pricing: VenuePricing | None) -> list[dict]:
        templates: list[dict] = []
        if pricing is None:
            templates.append(
                {
                    "slot_id": None,
                    "food_slot_id": None,
                    "slot_kind": "venue",
                    "slot_key": "full_day",
                    "slot_name": "Full Day",
                    "time_label": None,
                }
            )
            return templates

        mode = pricing.pricing_mode or "full_day"
        slots = [s for s in (pricing.slots or []) if s.deleted_at is None and s.enabled]
        if mode == "slot_based":
            venue_slots = [s for s in slots if s.slot_key != "full_day"] or slots
        else:
            venue_slots = [s for s in slots if s.slot_key == "full_day"] or slots[:1]
        if not venue_slots:
            templates.append(
                {
                    "slot_id": None,
                    "food_slot_id": None,
                    "slot_kind": "venue",
                    "slot_key": "full_day",
                    "slot_name": "Full Day",
                    "time_label": pricing.operating_hours,
                }
            )
        else:
            for slot in venue_slots:
                templates.append(self._venue_slot_template(slot))

        if pricing.pricing_type == "venue_food":
            foods = [f for f in (pricing.food_slots or []) if f.deleted_at is None and f.enabled]
            for food in foods:
                templates.append(self._food_slot_template(food))
        return templates

    def _venue_slot_template(self, slot: VenueSlot) -> dict:
        return {
            "slot_id": slot.id,
            "food_slot_id": None,
            "slot_kind": "venue",
            "slot_key": slot.slot_key or "custom",
            "slot_name": slot.slot_name,
            "time_label": slot.time_label,
        }

    def _food_slot_template(self, slot: VenueFoodSlot) -> dict:
        return {
            "slot_id": None,
            "food_slot_id": slot.id,
            "slot_kind": "food",
            "slot_key": slot.meal_key or "custom",
            "slot_name": slot.meal_name,
            "time_label": slot.time_label,
        }

    def _slot_match_key(self, slot_id, food_slot_id, slot_kind: str, slot_key: str) -> tuple:
        if slot_id:
            return ("slot", slot_id)
        if food_slot_id:
            return ("food", food_slot_id)
        return ("key", slot_kind, slot_key)

    async def _sync_day(
        self,
        venue: Venue,
        row: VenueAvailability,
        *,
        templates: list[dict],
        weekly_off: set[int],
        blocks,
        today: date,
        window_end: date,
        performed_by: uuid.UUID | None,
    ) -> None:
        existing = {
            self._slot_match_key(s.slot_id, s.food_slot_id, s.slot_kind, s.slot_key): s
            for s in (row.slots or [])
        }
        for template in templates:
            key = self._slot_match_key(
                template["slot_id"],
                template["food_slot_id"],
                template["slot_kind"],
                template["slot_key"],
            )
            if key in existing:
                slot = existing[key]
                slot.slot_name = template["slot_name"]
                slot.time_label = template["time_label"]
                continue
            slot = VenueSlotAvailability(
                id=uuid.uuid4(),
                availability_id=row.id,
                slot_id=template["slot_id"],
                food_slot_id=template["food_slot_id"],
                slot_kind=template["slot_kind"],
                slot_key=template["slot_key"],
                slot_name=template["slot_name"],
                time_label=template["time_label"],
                status=AvailabilityStatus.AVAILABLE.value,
            )
            self.db.add(slot)
            row.slots.append(slot)
            existing[key] = slot

        template_keys = {
            self._slot_match_key(t["slot_id"], t["food_slot_id"], t["slot_kind"], t["slot_key"])
            for t in templates
        }
        for key, slot in existing.items():
            if slot.status in PROTECTED_SLOT_STATUSES:
                continue
            if key not in template_keys and slot.status in MUTABLE_SLOT_STATUSES:
                slot.status = AvailabilityStatus.EXPIRED.value
                slot.booking_id = None
                continue
            self._apply_slot_state(
                venue,
                row,
                slot,
                weekly_off=weekly_off,
                blocks=blocks,
                today=today,
                window_end=window_end,
            )

        old_status = row.status
        self._rollup_day(row)
        if old_status != row.status:
            await self.logs.add(
                availability_id=row.id,
                action="generated",
                old_status=old_status,
                new_status=row.status,
                performed_by=performed_by,
            )

    def _apply_slot_state(
        self,
        venue: Venue,
        row: VenueAvailability,
        slot: VenueSlotAvailability,
        *,
        weekly_off: set[int],
        blocks,
        today: date,
        window_end: date,
    ) -> None:
        if slot.status in PROTECTED_SLOT_STATUSES:
            return
        matching = [
            b
            for b in blocks
            if block_matches_date(b, row.availability_date)
            and self._block_targets_slot(b, slot)
        ]
        if matching:
            block = matching[0]
            slot.status = (
                AvailabilityStatus.HOLIDAY.value
                if block.reason == BlockReason.HOLIDAY.value
                else AvailabilityStatus.BLOCKED.value
            )
            slot.blocked_reason = block.reason
            slot.booking_id = None
            slot.booking_ref = None
            slot.customer_name = None
            slot.event_type = None
            slot.guests = None
            return

        if row.availability_date.weekday() in weekly_off:
            slot.status = AvailabilityStatus.CLOSED.value
            slot.blocked_reason = "weekly_off"
            return
        pricing = venue.active_pricing()
        hours = (
            (pricing.operating_hours if pricing and pricing.operating_hours else None)
            or venue.operating_hours
            or ""
        ).strip().lower()
        if hours in {"closed", "off", "holiday"}:
            slot.status = AvailabilityStatus.CLOSED.value
            slot.blocked_reason = "closed"
            return

        inactive = venue.venue_status in {
            VenueStatus.INACTIVE.value,
            VenueStatus.ARCHIVED.value,
            VenueStatus.DELETED.value,
        }
        if row.availability_date > window_end:
            slot.status = AvailabilityStatus.EXPIRED.value
            slot.blocked_reason = None
            return
        if inactive:
            slot.status = AvailabilityStatus.BLOCKED.value
            slot.blocked_reason = "inactive_venue"
            return
        if slot.status == AvailabilityStatus.CANCELLED.value:
            slot.status = AvailabilityStatus.AVAILABLE.value
        slot.blocked_reason = None
        slot.status = AvailabilityStatus.AVAILABLE.value

    def _block_targets_slot(self, block, slot: VenueSlotAvailability) -> bool:
        if block.slot_id is None and block.food_slot_id is None:
            return True
        if block.slot_id and slot.slot_id == block.slot_id:
            return True
        if block.food_slot_id and slot.food_slot_id == block.food_slot_id:
            return True
        return False

    def _expire_future_outside_window(self, row: VenueAvailability) -> None:
        changed = False
        for slot in row.slots or []:
            if slot.status in PROTECTED_SLOT_STATUSES:
                continue
            if slot.status != AvailabilityStatus.EXPIRED.value:
                slot.status = AvailabilityStatus.EXPIRED.value
                changed = True
        if changed:
            self._rollup_day(row)

    def _rollup_day(self, row: VenueAvailability) -> None:
        slots = list(row.slots or [])
        venue_slots = [s for s in slots if s.slot_kind == "venue"] or slots
        statuses = [s.status for s in venue_slots]
        booked_like = {
            AvailabilityStatus.BOOKED.value,
            AvailabilityStatus.COMPLETED.value,
        }
        blocked_like = {
            AvailabilityStatus.BLOCKED.value,
            AvailabilityStatus.HOLIDAY.value,
            AvailabilityStatus.CLOSED.value,
        }
        available_count = sum(1 for s in statuses if s == AvailabilityStatus.AVAILABLE.value)
        booked_count = sum(1 for s in statuses if s in booked_like)
        row.available_capacity = available_count
        row.booked_capacity = booked_count

        if not statuses:
            row.status = AvailabilityStatus.AVAILABLE.value
            return
        if all(s == AvailabilityStatus.COMPLETED.value for s in statuses):
            row.status = AvailabilityStatus.COMPLETED.value
            return
        if all(s == AvailabilityStatus.HOLIDAY.value for s in statuses):
            row.status = AvailabilityStatus.HOLIDAY.value
            return
        if all(s == AvailabilityStatus.CLOSED.value for s in statuses):
            row.status = AvailabilityStatus.CLOSED.value
            return
        if all(s in blocked_like for s in statuses):
            row.status = AvailabilityStatus.BLOCKED.value
            return
        if booked_count and available_count:
            row.status = AvailabilityStatus.PARTIALLY_BOOKED.value
            return
        if booked_count and booked_count == len(statuses):
            row.status = (
                AvailabilityStatus.COMPLETED.value
                if all(s == AvailabilityStatus.COMPLETED.value for s in statuses)
                else AvailabilityStatus.BOOKED.value
            )
            return
        if booked_count:
            row.status = AvailabilityStatus.PARTIALLY_BOOKED.value
            return
        if all(s == AvailabilityStatus.EXPIRED.value for s in statuses):
            row.status = AvailabilityStatus.EXPIRED.value
            return
        if all(s == AvailabilityStatus.NO_BOOKING.value for s in statuses):
            row.status = AvailabilityStatus.NO_BOOKING.value
            return
        if all(s == AvailabilityStatus.CANCELLED.value for s in statuses):
            row.status = AvailabilityStatus.CANCELLED.value
            return
        row.status = AvailabilityStatus.AVAILABLE.value
