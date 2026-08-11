import math
from collections import defaultdict
from datetime import date, timedelta

from app.models.availability import AvailabilityStatus, VenueAvailability, VenueSlotAvailability
from app.models.booking import Booking, BookingStatus
from app.models.user import User
from app.models.venue import Venue
from app.repositories.availability_repository import AvailabilityRepository
from app.repositories.booking_repository import BookingRepository
from app.schemas.availability import (
    AvailabilityDashboard,
    AvailabilityDayBooking,
    AvailabilityDayDetailResponse,
    AvailabilityListResponse,
    AvailabilityMonthResponse,
    DayAvailabilityResponse,
    SlotAvailabilityResponse,
)
from app.services.permission_service import DataScope, PermissionService
from app.utils.availability_dates import month_bounds

BLOCKED_SLOT_STATUSES = {
    AvailabilityStatus.BLOCKED.value,
    AvailabilityStatus.HOLIDAY.value,
    AvailabilityStatus.CLOSED.value,
    AvailabilityStatus.EXPIRED.value,
    AvailabilityStatus.NO_BOOKING.value,
}
BOOKED_SLOT_STATUSES = {
    AvailabilityStatus.BOOKED.value,
    AvailabilityStatus.COMPLETED.value,
}


class AvailabilityCalendarService:
    def __init__(
        self,
        days: AvailabilityRepository,
        bookings: BookingRepository,
        permissions: PermissionService,
    ) -> None:
        self.days = days
        self.bookings = bookings
        self.permissions = permissions

    def _show_customer(self, actor: User) -> bool:
        return self.permissions.get_data_scope(actor) != DataScope.CUSTOMER_OWNED

    def _group_by_date(self, bookings: list[Booking]) -> dict[date, list[Booking]]:
        grouped: dict[date, list[Booking]] = defaultdict(list)
        seen: dict[date, set] = defaultdict(set)
        for booking in bookings:
            event_dates = [row.event_date for row in (booking.days or []) if row.event_date]
            if not event_dates:
                current = booking.start_date
                while current <= booking.end_date:
                    event_dates.append(current)
                    current += timedelta(days=1)
            for event_date in event_dates:
                if booking.id in seen[event_date]:
                    continue
                seen[event_date].add(booking.id)
                grouped[event_date].append(booking)
        return grouped

    def _slot_status_for_booking(self, booking: Booking, event_date: date, today: date) -> str:
        if booking.booking_status == BookingStatus.COMPLETED.value or event_date < today:
            return AvailabilityStatus.COMPLETED.value
        return AvailabilityStatus.BOOKED.value

    def _customer_name(self, booking: Booking) -> str:
        customer = booking.customer
        if customer is None:
            return ""
        return (
            (customer.full_name or "").strip()
            or f"{getattr(customer, 'first_name', '')} {getattr(customer, 'last_name', '')}".strip()
        )

    def _booking_card(
        self, booking: Booking, event_date: date, *, show_customer: bool
    ) -> AvailabilityDayBooking:
        day_slots = [
            (s.slot_name or s.slot_key or "").strip()
            for s in (booking.slots or [])
            if (s.event_date is None or s.event_date == event_date)
            and (s.slot_name or s.slot_key)
        ]
        if not day_slots:
            day_slots = [
                (s.slot_name or s.slot_key or "").strip()
                for s in (booking.slots or [])
                if s.slot_name or s.slot_key
            ]
        foods = [
            (f.meal_name or f.meal_key or "").strip()
            for f in (booking.food_items or [])
            if (f.event_date is None or f.event_date == event_date)
            and (f.meal_name or f.meal_key)
        ]
        if not foods:
            foods = [
                (f.meal_name or f.meal_key or "").strip()
                for f in (booking.food_items or [])
                if f.meal_name or f.meal_key
            ]
        return AvailabilityDayBooking(
            booking_id=booking.id,
            booking_number=booking.booking_number,
            customer_name=self._customer_name(booking) if show_customer else "",
            guest_count=booking.guest_count or 0,
            selected_slots=day_slots,
            selected_food_slots=foods,
            payment_status=booking.payment_status,
            booking_status=booking.booking_status,
            event_type=booking.event_type,
            total_amount=float(booking.total_amount or 0),
        )

    def _match_booking_for_slot(
        self,
        slot: VenueSlotAvailability,
        occupying: list[Booking],
        event_date: date,
    ) -> Booking | None:
        for booking in occupying:
            if slot.slot_kind == "food":
                for food in booking.food_items or []:
                    if food.event_date not in (None, event_date):
                        continue
                    if slot.food_slot_id and food.food_slot_id == slot.food_slot_id:
                        return booking
                    if food.meal_key and food.meal_key == slot.slot_key:
                        return booking
                continue
            if booking.booking_mode == "full_day":
                return booking
            for item in booking.slots or []:
                if item.event_date not in (None, event_date):
                    continue
                if slot.slot_id and item.venue_slot_id == slot.slot_id:
                    return booking
                if item.slot_key and item.slot_key == slot.slot_key:
                    return booking
                if item.slot_key == "full_day":
                    return booking
        return None

    def _slot_response(
        self,
        slot: VenueSlotAvailability,
        occupying: list[Booking],
        event_date: date,
        today: date,
        *,
        show_customer: bool,
        show_bookings: bool,
    ) -> SlotAvailabilityResponse:
        matched = self._match_booking_for_slot(slot, occupying, event_date)
        if matched:
            status = self._slot_status_for_booking(matched, event_date, today)
            return SlotAvailabilityResponse(
                id=slot.id,
                slot_id=slot.slot_id,
                food_slot_id=slot.food_slot_id,
                slot_kind=slot.slot_kind,
                slot_key=slot.slot_key,
                slot_name=slot.slot_name,
                time_label=slot.time_label,
                status=status,
                booking_id=matched.id if show_bookings else None,
                booking_ref=matched.booking_number if show_bookings else None,
                customer_name=self._customer_name(matched) or None
                if show_customer
                else None,
                event_type=matched.event_type if show_bookings else None,
                guests=matched.guest_count if show_bookings else None,
                blocked_reason=None,
            )
        status = slot.status if slot.status in BLOCKED_SLOT_STATUSES else AvailabilityStatus.AVAILABLE.value
        return SlotAvailabilityResponse(
            id=slot.id,
            slot_id=slot.slot_id,
            food_slot_id=slot.food_slot_id,
            slot_kind=slot.slot_kind,
            slot_key=slot.slot_key,
            slot_name=slot.slot_name,
            time_label=slot.time_label,
            status=status,
            booking_id=None,
            booking_ref=None,
            customer_name=None,
            event_type=None,
            guests=None,
            blocked_reason=slot.blocked_reason if status in BLOCKED_SLOT_STATUSES else None,
        )

    def _roll_day_status(
        self,
        event_date: date,
        venue_slots: list[SlotAvailabilityResponse],
        occupying: list[Booking],
        today: date,
        fallback: str,
    ) -> str:
        if occupying:
            flags = [slot.status for slot in venue_slots] or [AvailabilityStatus.BOOKED.value]
            occupied = sum(1 for status in flags if status in BOOKED_SLOT_STATUSES)
            available = sum(1 for status in flags if status == AvailabilityStatus.AVAILABLE.value)
            if occupied and available:
                return AvailabilityStatus.PARTIALLY_BOOKED.value
            completed = event_date < today or all(
                booking.booking_status == BookingStatus.COMPLETED.value for booking in occupying
            )
            return AvailabilityStatus.COMPLETED.value if completed else AvailabilityStatus.BOOKED.value
        flags = [slot.status for slot in venue_slots]
        if flags and all(status == AvailabilityStatus.HOLIDAY.value for status in flags):
            return AvailabilityStatus.HOLIDAY.value
        if flags and all(status == AvailabilityStatus.CLOSED.value for status in flags):
            return AvailabilityStatus.CLOSED.value
        if flags and all(status in BLOCKED_SLOT_STATUSES for status in flags):
            return AvailabilityStatus.BLOCKED.value
        if fallback in BLOCKED_SLOT_STATUSES and not occupying:
            return fallback
        return AvailabilityStatus.AVAILABLE.value

    def to_day(
        self,
        row: VenueAvailability,
        occupying: list[Booking],
        *,
        today: date,
        show_customer: bool,
        show_bookings: bool,
    ) -> DayAvailabilityResponse:
        slots = [
            self._slot_response(
                slot,
                occupying,
                row.availability_date,
                today,
                show_customer=show_customer,
                show_bookings=show_bookings,
            )
            for slot in (row.slots or [])
        ]
        venue_slots = [slot for slot in slots if slot.slot_kind == "venue"] or [
            slot for slot in slots if slot.slot_kind != "food"
        ]
        food_slots = [slot for slot in slots if slot.slot_kind == "food"]
        available_slots = [slot.slot_name for slot in venue_slots if slot.status == AvailabilityStatus.AVAILABLE.value]
        booked_slots = [slot.slot_name for slot in venue_slots if slot.status in BOOKED_SLOT_STATUSES]
        available_food = [slot.slot_name for slot in food_slots if slot.status == AvailabilityStatus.AVAILABLE.value]
        booked_food = [slot.slot_name for slot in food_slots if slot.status in BOOKED_SLOT_STATUSES]
        cards = (
            [self._booking_card(booking, row.availability_date, show_customer=show_customer) for booking in occupying]
            if show_bookings
            else []
        )
        status = self._roll_day_status(
            row.availability_date, venue_slots, occupying, today, row.status
        )
        total = max(len(venue_slots), 1)
        occupancy = round((len(booked_slots) / total) * 100) if venue_slots else 0
        return DayAvailabilityResponse(
            id=row.id,
            date=row.availability_date,
            status=status,
            available_capacity=len(available_slots),
            booked_capacity=len(booked_slots),
            available_slots=len(available_slots),
            booked_slots=len(booked_slots),
            booking_count=len(occupying),
            occupancy=occupancy,
            holiday=status in {AvailabilityStatus.HOLIDAY.value, AvailabilityStatus.CLOSED.value},
            blocked=status
            in {
                AvailabilityStatus.BLOCKED.value,
                AvailabilityStatus.HOLIDAY.value,
                AvailabilityStatus.CLOSED.value,
            },
            notes=row.notes,
            is_manual_override=row.is_manual_override,
            slots=slots,
            booking_ids=[card.booking_id for card in cards],
            booked_slot_names=booked_slots,
            available_slot_names=available_slots,
            booked_food_slots=booked_food,
            available_food_slots=available_food,
            guest_count=sum(card.guest_count for card in cards) if show_bookings else 0,
            bookings=cards,
        )

    def dashboard_from_days(
        self, days: list[DayAvailabilityResponse], today: date
    ) -> AvailabilityDashboard:
        available = booked = completed = blocked = todays = 0
        for day in days:
            if day.status == AvailabilityStatus.AVAILABLE.value:
                available += 1
            elif day.status in {
                AvailabilityStatus.BOOKED.value,
                AvailabilityStatus.PARTIALLY_BOOKED.value,
            }:
                booked += 1
            elif day.status == AvailabilityStatus.COMPLETED.value:
                completed += 1
            elif day.status in {
                AvailabilityStatus.BLOCKED.value,
                AvailabilityStatus.HOLIDAY.value,
                AvailabilityStatus.CLOSED.value,
            }:
                blocked += 1
            if day.date == today:
                todays = day.booking_count
        denom = available + booked + completed
        occupancy = round(((booked + completed) / denom) * 100) if denom else 0
        return AvailabilityDashboard(
            available_days=available,
            booked_days=booked,
            completed_days=completed,
            blocked_days=blocked,
            occupancy_percent=occupancy,
            todays_bookings=todays,
        )

    def calculate_availability(
        self,
        row: VenueAvailability,
        occupying: list[Booking],
        *,
        today: date,
        show_customer: bool,
        show_bookings: bool,
    ) -> DayAvailabilityResponse:
        return self.to_day(
            row,
            occupying,
            today=today,
            show_customer=show_customer,
            show_bookings=show_bookings,
        )

    def get_available_slots(self, day: DayAvailabilityResponse) -> list[str]:
        return list(day.available_slot_names)

    def calculate_occupancy(
        self, days: list[DayAvailabilityResponse], today: date
    ) -> AvailabilityDashboard:
        return self.dashboard_from_days(days, today)

    async def overlay_range(
        self,
        actor: User,
        venue: Venue,
        start: date,
        end: date,
        rows: list[VenueAvailability] | None = None,
    ) -> list[DayAvailabilityResponse]:
        rows = rows if rows is not None else await self.days.list_range(venue.id, start, end)
        occupying = await self.bookings.list_occupying_for_venue(venue.id, start, end)
        grouped = self._group_by_date(occupying)
        show_customer = self._show_customer(actor)
        show_bookings = self.permissions.get_data_scope(actor) != DataScope.CUSTOMER_OWNED
        today = date.today()
        return [
            self.to_day(
                row,
                grouped.get(row.availability_date, []),
                today=today,
                show_customer=show_customer,
                show_bookings=show_bookings,
            )
            for row in rows
        ]

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
        days = await self.overlay_range(actor, venue, start, end)
        month_days = [day for day in days if month_start <= day.date <= month_end]
        pricing = venue.active_pricing()
        return AvailabilityMonthResponse(
            venue_id=venue.id,
            month=f"{year:04d}-{month:02d}",
            pricing_mode=pricing.pricing_mode if pricing else "full_day",
            pricing_type=pricing.pricing_type if pricing else "venue_only",
            operating_hours=(pricing.operating_hours if pricing else None) or venue.operating_hours,
            booking_window_days=int(getattr(pricing, "booking_window_days", None) or 180),
            minimum_notice_hours=int(getattr(pricing, "minimum_notice_hours", None) or 24),
            days=days,
            dashboard=self.dashboard_from_days(month_days, date.today()),
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
        else:
            today = date.today()
            start, end = month_bounds(today.year, today.month)
        days = await self.overlay_range(actor, venue, start, end)
        filtered = days
        if status:
            filtered = [day for day in filtered if day.status == status]
        if slot:
            filtered = [
                day
                for day in filtered
                if any(item.slot_key == slot for item in day.slots)
            ]
        if booking_status:
            filtered = [
                day
                for day in filtered
                if any(card.booking_status == booking_status for card in day.bookings)
            ]
        if search:
            needle = search.strip().lower()
            filtered = [
                day
                for day in filtered
                if needle in day.date.isoformat()
                or any(
                    needle in (card.booking_number or "").lower()
                    or needle in (card.customer_name or "").lower()
                    for card in day.bookings
                )
            ]
        if customer:
            needle = customer.strip().lower()
            filtered = [
                day
                for day in filtered
                if any(needle in (card.customer_name or "").lower() for card in day.bookings)
            ]
        total = len(filtered)
        page = max(page, 1)
        page_size = min(max(page_size, 1), 400)
        start_idx = (page - 1) * page_size
        items = filtered[start_idx : start_idx + page_size]
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return AvailabilityListResponse(
            venue_id=venue.id,
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            dashboard=self.dashboard_from_days(days, date.today()),
        )

    async def day_detail(
        self, actor: User, venue: Venue, row: VenueAvailability
    ) -> AvailabilityDayDetailResponse:
        days = await self.overlay_range(
            actor, venue, row.availability_date, row.availability_date, rows=[row]
        )
        day = days[0]
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
            bookings=day.bookings,
        )
