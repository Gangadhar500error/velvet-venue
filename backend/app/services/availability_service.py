from __future__ import annotations

import uuid
from datetime import date

from fastapi import HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.availability import AvailabilityStatus, VenueSlotAvailability
from app.models.user import User
from app.models.venue import Venue
from app.repositories.availability_repository import (
    AvailabilityBlockRepository,
    AvailabilityLogRepository,
    AvailabilityRepository,
    AvailabilitySlotRepository,
)
from app.repositories.booking_repository import BookingRepository
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.repositories.venue_repository import VenueRepository
from app.schemas.availability import (
    AvailabilityDashboard,
    AvailabilityDayBooking,
    AvailabilityDayDetailResponse,
    AvailabilityListResponse,
    AvailabilityMonthResponse,
    DayAvailabilityResponse,
    BlockCreateRequest,
    BlockMutationResponse,
    BlockResponse,
    BlockUpdateRequest,
    BookingHoldRequest,
    MessageResponse,
)
from app.services.availability_block_service import AvailabilityBlockService
from app.services.availability_calendar_service import AvailabilityCalendarService
from app.services.availability_generator_service import AvailabilityGeneratorService
from app.services.availability_validation_service import AvailabilityValidationService
from app.services.permission_service import DataScope, PermissionService
from app.utils.availability_dates import month_bounds


class AvailabilityService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.venues = VenueRepository(db)
        self.owners = VenueOwnerRepository(db)
        self.bookings = BookingRepository(db)
        self.permissions = PermissionService(db)
        self.days = AvailabilityRepository(db)
        self.slots = AvailabilitySlotRepository(db)
        self.block_repo = AvailabilityBlockRepository(db)
        self.logs = AvailabilityLogRepository(db)
        self.generator = AvailabilityGeneratorService(db)
        self.rules = AvailabilityValidationService()
        self.calendar = AvailabilityCalendarService(self.days, self.bookings, self.permissions)
        self.blocks = AvailabilityBlockService(db)

    def _assert_read(self, actor: User, venue: Venue) -> None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return
        if scope == DataScope.VENDOR_OWNED:
            profile = venue.business_profile
            owner = profile.venue_owner if profile else None
            if owner is None or owner.user_id != actor.id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="You can only view availability for your own venues.",
                )
            return
        if venue.venue_status not in {"published"}:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers can only view published venue availability.",
            )

    def _assert_write(self, actor: User, venue: Venue) -> None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot update availability.",
            )
        self._assert_read(actor, venue)

    async def _load_venue(self, venue_id: uuid.UUID) -> Venue:
        venue = await self.venues.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found.")
        return venue

    async def month(
        self,
        actor: User,
        venue_id: uuid.UUID,
        year: int,
        month: int,
        start: date | None = None,
        end: date | None = None,
    ) -> AvailabilityMonthResponse:
        venue = await self._load_venue(venue_id)
        self._assert_read(actor, venue)
        await self.generator.generate_for_venue(
            venue.id, performed_by=actor.id, fill_missing_only=True
        )
        await self.db.commit()
        return await self.calendar.month_payload(
            actor, venue, year, month, start=start, end=end
        )

    async def list_days(
        self,
        actor: User,
        venue_id: uuid.UUID,
        *,
        year: int | None,
        month: int | None,
        status: str | None,
        slot: str | None,
        booking_status: str | None,
        search: str | None,
        customer: str | None,
        page: int,
        page_size: int,
    ) -> AvailabilityListResponse:
        venue = await self._load_venue(venue_id)
        self._assert_read(actor, venue)
        await self.generator.generate_for_venue(
            venue.id, performed_by=actor.id, fill_missing_only=True
        )
        await self.db.commit()
        return await self.calendar.list_payload(
            actor,
            venue,
            year=year,
            month=month,
            status=status,
            slot=slot,
            booking_status=booking_status,
            search=search,
            customer=customer,
            page=page,
            page_size=page_size,
        )

    async def day_detail(
        self, actor: User, venue_id: uuid.UUID, availability_date: date
    ) -> AvailabilityDayDetailResponse:
        venue = await self._load_venue(venue_id)
        self._assert_read(actor, venue)
        await self.generator.generate_for_venue(
            venue.id, performed_by=actor.id, fill_missing_only=True
        )
        await self.db.commit()
        row = await self.days.get_day(venue.id, availability_date)
        if row is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Availability not found for this date.",
            )
        return await self.calendar.day_detail(actor, venue, row)

    async def dashboard(
        self, actor: User, venue_id: uuid.UUID, year: int | None, month: int | None
    ) -> AvailabilityDashboard:
        venue = await self._load_venue(venue_id)
        self._assert_read(actor, venue)
        await self.generator.generate_for_venue(
            venue.id, performed_by=actor.id, fill_missing_only=True
        )
        await self.db.commit()
        today = date.today()
        y = year or today.year
        m = month or today.month
        start, end = month_bounds(y, m)
        days = await self.calendar.overlay_range(actor, venue, start, end)
        return self.calendar.dashboard_from_days(days, today)

    async def get_venue_calendar(
        self,
        actor: User,
        venue_id: uuid.UUID,
        year: int,
        month: int,
        start: date | None = None,
        end: date | None = None,
    ) -> AvailabilityMonthResponse:
        return await self.month(actor, venue_id, year, month, start, end)

    async def get_day_details(
        self, actor: User, venue_id: uuid.UUID, availability_date: date
    ) -> AvailabilityDayDetailResponse:
        return await self.day_detail(actor, venue_id, availability_date)

    async def get_bookings_for_day(
        self, actor: User, venue_id: uuid.UUID, availability_date: date
    ) -> list[AvailabilityDayBooking]:
        detail = await self.day_detail(actor, venue_id, availability_date)
        return detail.bookings

    def calculate_availability(self, *args, **kwargs) -> DayAvailabilityResponse:
        return self.calendar.calculate_availability(*args, **kwargs)

    def get_available_slots(self, day: DayAvailabilityResponse) -> list[str]:
        return self.calendar.get_available_slots(day)

    def calculate_occupancy(self, days, today: date) -> AvailabilityDashboard:
        return self.calendar.calculate_occupancy(days, today)

    async def refresh_calendar(self, actor: User, venue_id: uuid.UUID) -> MessageResponse:
        return await self.regenerate(actor, venue_id)

    async def regenerate(self, actor: User, venue_id: uuid.UUID) -> MessageResponse:
        venue = await self._load_venue(venue_id)
        self._assert_write(actor, venue)
        created = await self.generator.generate_for_venue(venue.id, performed_by=actor.id)
        await self.db.commit()
        return MessageResponse(message=f"Availability calendar regenerated ({created} new dates).")

    async def create_block(
        self, actor: User, venue_id: uuid.UUID, payload: BlockCreateRequest
    ) -> BlockMutationResponse:
        venue = await self._load_venue(venue_id)
        self._assert_write(actor, venue)
        return await self.blocks.create(actor, venue.id, payload)

    async def update_block(
        self, actor: User, block_id: uuid.UUID, payload: BlockUpdateRequest
    ) -> BlockMutationResponse:
        row = await self.block_repo.get_by_id(block_id)
        if row is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Block not found.")
        venue = await self._load_venue(row.venue_id)
        self._assert_write(actor, venue)
        return await self.blocks.update(actor, block_id, payload)

    async def delete_block(self, actor: User, block_id: uuid.UUID) -> MessageResponse:
        row = await self.block_repo.get_by_id(block_id)
        if row is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Block not found.")
        venue = await self._load_venue(row.venue_id)
        self._assert_write(actor, venue)
        return await self.blocks.delete(actor, block_id)

    async def list_blocks(self, actor: User, venue_id: uuid.UUID) -> list[BlockResponse]:
        venue = await self._load_venue(venue_id)
        self._assert_read(actor, venue)
        rows = await self.block_repo.list_active(venue.id)
        return [self.blocks.to_response(r) for r in rows]

    def _find_slot(
        self,
        slots: list[VenueSlotAvailability],
        *,
        slot_id: uuid.UUID | None,
        food_slot_id: uuid.UUID | None,
        slot_key: str | None,
        kind: str = "venue",
    ) -> VenueSlotAvailability | None:
        if slot_id:
            found = next((s for s in slots if s.slot_id == slot_id), None)
            if found:
                return found
        if food_slot_id:
            found = next((s for s in slots if s.food_slot_id == food_slot_id), None)
            if found:
                return found
        if slot_key:
            found = next(
                (s for s in slots if s.slot_key == slot_key and s.slot_kind == kind),
                None,
            )
            if found:
                return found
        venue_slots = [s for s in slots if s.slot_kind == kind]
        if len(venue_slots) == 1:
            return venue_slots[0]
        return next((s for s in venue_slots if s.slot_key == "full_day"), None)

    async def reserve(
        self,
        actor: User | None,
        venue_id: uuid.UUID,
        payload: BookingHoldRequest,
        *,
        commit: bool = True,
        skip_write_check: bool = False,
    ) -> None:
        venue = await self._load_venue(venue_id)
        if actor is not None and not skip_write_check:
            self._assert_write(actor, venue)
        self.rules.assert_venue_active(venue)
        pricing = venue.active_pricing()
        self.rules.assert_within_window(payload.event_date, pricing)
        await self.generator.generate_for_venue(
            venue.id,
            performed_by=actor.id if actor else None,
            fill_missing_only=True,
        )
        day = await self.days.get_day_for_update(venue.id, payload.event_date)
        if day is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Availability not found for this date.",
            )
        slot = self._find_slot(
            day.slots or [],
            slot_id=payload.slot_id,
            food_slot_id=None,
            slot_key=payload.slot_key,
            kind="venue",
        )
        if slot is None:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Requested slot is not available on this date.",
            )
        self.rules.assert_slot_bookable(slot)
        self.rules.assert_no_overlap(day, slot)
        self.rules.assert_minimum_notice(payload.event_date, pricing, slot)
        self.rules.assert_operating_hours(pricing, slot)

        food_slot = None
        if payload.food_slot_id:
            food_slot = self._find_slot(
                day.slots or [],
                slot_id=None,
                food_slot_id=payload.food_slot_id,
                slot_key=None,
                kind="food",
            )
            if food_slot is None:
                raise HTTPException(
                    status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Requested food slot is not available on this date.",
                )
            self.rules.assert_slot_bookable(food_slot)

        venue_targets = [slot]
        if slot.slot_key == "full_day" or (pricing and pricing.pricing_mode == "full_day"):
            venue_targets = [s for s in (day.slots or []) if s.slot_kind == "venue"] or [slot]
            for target in venue_targets:
                if target.id != slot.id:
                    self.rules.assert_slot_bookable(target)
        for target in venue_targets:
            old = target.status
            self._apply_hold(target, payload)
            await self.logs.add(
                availability_id=day.id,
                action="booked",
                old_status=old,
                new_status=target.status,
                performed_by=actor.id if actor else None,
                slot_availability_id=target.id,
                notes=str(payload.booking_id),
            )
        if food_slot is not None:
            food_old = food_slot.status
            self._apply_hold(food_slot, payload)
            await self.logs.add(
                availability_id=day.id,
                action="booked",
                old_status=food_old,
                new_status=food_slot.status,
                performed_by=actor.id if actor else None,
                slot_availability_id=food_slot.id,
                notes=str(payload.booking_id),
            )
        self.generator._rollup_day(day)
        if commit:
            await self.db.commit()

    async def hold_food_slot(
        self,
        venue_id: uuid.UUID,
        event_date: date,
        food_slot_id: uuid.UUID,
        payload: BookingHoldRequest,
        *,
        commit: bool = False,
    ) -> None:
        day = await self.days.get_day_for_update(venue_id, event_date)
        if day is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Availability not found for this date.",
            )
        food_slot = self._find_slot(
            day.slots or [],
            slot_id=None,
            food_slot_id=food_slot_id,
            slot_key=None,
            kind="food",
        )
        if food_slot is None:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Requested food slot is not available on this date.",
            )
        self.rules.assert_slot_bookable(food_slot)
        old = food_slot.status
        self._apply_hold(food_slot, payload)
        await self.logs.add(
            availability_id=day.id,
            action="booked",
            old_status=old,
            new_status=food_slot.status,
            performed_by=None,
            slot_availability_id=food_slot.id,
            notes=str(payload.booking_id),
        )
        self.generator._rollup_day(day)
        if commit:
            await self.db.commit()

    def _apply_hold(self, slot: VenueSlotAvailability, payload: BookingHoldRequest) -> None:
        slot.status = AvailabilityStatus.BOOKED.value
        slot.booking_id = payload.booking_id
        slot.booking_ref = payload.booking_ref
        slot.customer_name = payload.customer_name
        slot.event_type = payload.event_type
        slot.guests = payload.guests
        slot.blocked_reason = None

    async def release(
        self, booking_id: uuid.UUID, actor: User | None = None, *, commit: bool = True
    ) -> None:
        rows = await self.slots.list_for_booking(booking_id)
        if not rows:
            return
        days = {row.availability_id: row.availability for row in rows}
        for slot in rows:
            if slot.status == AvailabilityStatus.COMPLETED.value:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Cannot modify a completed booking.",
                )
            old = slot.status
            blocked = slot.blocked_reason
            slot.status = (
                AvailabilityStatus.BLOCKED.value
                if blocked
                else AvailabilityStatus.AVAILABLE.value
            )
            slot.booking_id = None
            slot.booking_ref = None
            slot.customer_name = None
            slot.event_type = None
            slot.guests = None
            await self.logs.add(
                availability_id=slot.availability_id,
                action="cancelled",
                old_status=old,
                new_status=slot.status,
                performed_by=actor.id if actor else None,
                slot_availability_id=slot.id,
                notes=str(booking_id),
            )
        for day in days.values():
            if day is not None:
                self.generator._rollup_day(day)
        if commit:
            await self.db.commit()

    async def complete(
        self, booking_id: uuid.UUID, actor: User | None = None, *, commit: bool = True
    ) -> None:
        rows = await self.slots.list_for_booking(booking_id)
        if not rows:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Booking hold not found."
            )
        days = {}
        for slot in rows:
            self.rules.assert_can_complete(slot)
            old = slot.status
            slot.status = AvailabilityStatus.COMPLETED.value
            days[slot.availability_id] = slot.availability
            await self.logs.add(
                availability_id=slot.availability_id,
                action="completed",
                old_status=old,
                new_status=slot.status,
                performed_by=actor.id if actor else None,
                slot_availability_id=slot.id,
                notes=str(booking_id),
            )
        for day in days.values():
            if day is not None:
                self.generator._rollup_day(day)
        if commit:
            await self.db.commit()
