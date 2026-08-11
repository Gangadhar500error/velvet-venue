import math
from datetime import date

from app.models.availability import AvailabilityStatus, VenueAvailability, VenueSlotAvailability
from app.models.user import User
from app.models.venue import Venue
from app.repositories.availability_repository import AvailabilityRepository
from app.schemas.availability import (
    AvailabilityDayDetailResponse,
    AvailabilityListResponse,
    AvailabilityMonthResponse,
    DayAvailabilityResponse,
    SlotAvailabilityResponse,
)
from app.services.availability_dashboard_service import AvailabilityDashboardService
from app.services.permission_service import DataScope, PermissionService
from app.utils.availability_dates import month_bounds


class AvailabilityCalendarService:
    def __init__(
        self,
        days: AvailabilityRepository,
        dashboard: AvailabilityDashboardService,
        permissions: PermissionService,
    ) -> None:
        self.days = days
        self.dashboard = dashboard
        self.permissions = permissions

    def _show_customer(self, actor: User) -> bool:
        return self.permissions.get_data_scope(actor) == DataScope.ALL

    def _slot_response(
        self, slot: VenueSlotAvailability, *, show_customer: bool
    ) -> SlotAvailabilityResponse:
        return SlotAvailabilityResponse(
            id=slot.id,
            slot_id=slot.slot_id,
            food_slot_id=slot.food_slot_id,
            slot_kind=slot.slot_kind,
            slot_key=slot.slot_key,
            slot_name=slot.slot_name,
            time_label=slot.time_label,
            status=slot.status,
            booking_id=slot.booking_id,
            booking_ref=slot.booking_ref,
            customer_name=slot.customer_name if show_customer else None,
            event_type=slot.event_type,
            guests=slot.guests,
            blocked_reason=slot.blocked_reason,
        )

    def to_day(
        self, row: VenueAvailability, *, show_customer: bool
    ) -> DayAvailabilityResponse:
        slots = [self._slot_response(s, show_customer=show_customer) for s in (row.slots or [])]
        venue_slots = [s for s in slots if s.slot_kind == "venue"] or slots
        available_slots = sum(1 for s in venue_slots if s.status == AvailabilityStatus.AVAILABLE.value)
        booked_slots = sum(
            1
            for s in venue_slots
            if s.status in {AvailabilityStatus.BOOKED.value, AvailabilityStatus.COMPLETED.value}
        )
        booking_ids = {s.booking_id for s in slots if s.booking_id}
        total = max(len(venue_slots), 1)
        occupancy = round((booked_slots / total) * 100) if venue_slots else 0
        return DayAvailabilityResponse(
            id=row.id,
            date=row.availability_date,
            status=row.status,
            available_capacity=row.available_capacity,
            booked_capacity=row.booked_capacity,
            available_slots=available_slots,
            booked_slots=booked_slots,
            booking_count=len(booking_ids),
            occupancy=occupancy,
            holiday=row.status in {
                AvailabilityStatus.HOLIDAY.value,
                AvailabilityStatus.CLOSED.value,
            },
            blocked=row.status
            in {
                AvailabilityStatus.BLOCKED.value,
                AvailabilityStatus.HOLIDAY.value,
                AvailabilityStatus.CLOSED.value,
            },
            notes=row.notes,
            is_manual_override=row.is_manual_override,
            slots=slots,
        )

    async def month_payload(
        self,
        actor: User,
        venue: Venue,
        year: int,
        month: int,
        start: date | None = None,
        end: date | None = None,
    ) -> AvailabilityMonthResponse:
        month_start, month_end = month_bounds(year, month)
        start = start or month_start
        end = end or month_end
        if end < start:
            start, end = end, start
        rows = await self.days.list_range(venue.id, start, end)
        show = self._show_customer(actor)
        days = [self.to_day(row, show_customer=show) for row in rows]
        pricing = venue.active_pricing()
        dashboard = await self.dashboard.for_range(venue.id, month_start, month_end)
        return AvailabilityMonthResponse(
            venue_id=venue.id,
            month=f"{year:04d}-{month:02d}",
            pricing_mode=pricing.pricing_mode if pricing else "full_day",
            pricing_type=pricing.pricing_type if pricing else "venue_only",
            operating_hours=(pricing.operating_hours if pricing else None) or venue.operating_hours,
            booking_window_days=int(getattr(pricing, "booking_window_days", None) or 180),
            minimum_notice_hours=int(getattr(pricing, "minimum_notice_hours", None) or 24),
            days=days,
            dashboard=dashboard,
        )

    async def list_payload(
        self,
        actor: User,
        venue: Venue,
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
        start = end = None
        if year and month:
            start, end = month_bounds(year, month)
        elif year:
            start, end = date(year, 1, 1), date(year, 12, 31)
        rows, total = await self.days.list_filtered(
            venue.id,
            start=start,
            end=end,
            status=status,
            slot_key=slot,
            booking_status=booking_status,
            search=search,
            customer=customer,
            page=page,
            page_size=page_size,
        )
        show = self._show_customer(actor)
        items = [self.to_day(row, show_customer=show) for row in rows]
        dash_start, dash_end = start, end
        if dash_start is None:
            today = date.today()
            dash_start, dash_end = month_bounds(today.year, today.month)
        dashboard = await self.dashboard.for_range(venue.id, dash_start, dash_end)
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return AvailabilityListResponse(
            venue_id=venue.id,
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            dashboard=dashboard,
        )

    def day_detail(
        self, actor: User, venue: Venue, row: VenueAvailability
    ) -> AvailabilityDayDetailResponse:
        show = self._show_customer(actor)
        day = self.to_day(row, show_customer=show)
        pricing = venue.active_pricing()
        return AvailabilityDayDetailResponse(
            venue_id=venue.id,
            venue_name=venue.venue_name,
            booking_type=pricing.pricing_type if pricing else "venue_only",
            pricing_mode=pricing.pricing_mode if pricing else "full_day",
            operating_hours=(pricing.operating_hours if pricing else None) or venue.operating_hours,
            day=day,
            occupancy=day.occupancy,
            vendor_notes=row.notes or venue.notes,
        )
