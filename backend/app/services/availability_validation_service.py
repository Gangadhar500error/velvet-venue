from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status as http_status

from app.models.availability import AvailabilityStatus, VenueAvailability, VenueSlotAvailability
from app.models.venue import Venue, VenuePricing, VenueStatus
from app.utils.time_ranges import parse_time_range

BOOKABLE = {AvailabilityStatus.AVAILABLE.value}
PROTECTED = {AvailabilityStatus.BOOKED.value, AvailabilityStatus.COMPLETED.value}
BLOCKED_LIKE = {
    AvailabilityStatus.BLOCKED.value,
    AvailabilityStatus.HOLIDAY.value,
    AvailabilityStatus.CLOSED.value,
}


class AvailabilityValidationService:
    def assert_venue_active(self, venue: Venue) -> None:
        if venue.venue_status in {
            VenueStatus.INACTIVE.value,
            VenueStatus.ARCHIVED.value,
            VenueStatus.DELETED.value,
        }:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot book an inactive venue.",
            )

    def assert_within_window(
        self, event_date: date, pricing: VenuePricing | None, today: date | None = None
    ) -> None:
        today = today or date.today()
        if event_date < today:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot book a date in the past.",
            )
        window = int(getattr(pricing, "booking_window_days", None) or 180)
        if window > 0 and event_date > today + timedelta(days=window):
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Date is outside the booking window.",
            )

    def assert_minimum_notice(
        self,
        event_date: date,
        pricing: VenuePricing | None,
        slot: VenueSlotAvailability | None = None,
        now: datetime | None = None,
    ) -> None:
        hours = int(getattr(pricing, "minimum_notice_hours", None) or 24)
        if hours <= 0:
            return
        now = now or datetime.now()
        start = time(0, 0)
        if slot and slot.time_label:
            parsed, _ = parse_time_range(slot.time_label)
            if parsed:
                start = parsed
        event_at = datetime.combine(event_date, start)
        if event_at < now + timedelta(hours=hours):
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot book before the minimum notice period.",
            )

    def assert_operating_hours(
        self, pricing: VenuePricing | None, slot: VenueSlotAvailability | None
    ) -> None:
        if pricing is None or slot is None:
            return
        op_start = pricing.operating_start_time
        op_end = pricing.operating_end_time
        if op_start is None or op_end is None:
            return
        slot_start, slot_end = parse_time_range(slot.time_label)
        if slot_start and slot_start < op_start:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot book outside operating hours.",
            )
        if slot_end and op_end and slot_end > op_end and slot_end > slot_start:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot book outside operating hours.",
            )

    def assert_slot_bookable(self, slot: VenueSlotAvailability) -> None:
        if slot.status in BLOCKED_LIKE:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Cannot book a blocked slot.",
            )
        if slot.status == AvailabilityStatus.COMPLETED.value:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Cannot modify a completed booking.",
            )
        if slot.status == AvailabilityStatus.BOOKED.value or slot.booking_id is not None:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Slot is already booked.",
            )
        if slot.status not in BOOKABLE:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail=f"Slot is not available ({slot.status}).",
            )

    def assert_no_overlap(
        self, day: VenueAvailability, slot: VenueSlotAvailability
    ) -> None:
        if slot.slot_kind != "venue":
            return
        for other in day.slots or []:
            if other.id == slot.id or other.slot_kind != "venue":
                continue
            if other.status not in PROTECTED:
                continue
            if other.slot_key == "full_day" or slot.slot_key == "full_day":
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Cannot overlap a full-day booking.",
                )

    def assert_not_historical_delete(self, day: VenueAvailability, today: date | None = None) -> None:
        today = today or date.today()
        if day.availability_date < today:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot delete historical availability.",
            )

    def assert_can_complete(self, slot: VenueSlotAvailability) -> None:
        if slot.status == AvailabilityStatus.COMPLETED.value:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Cannot modify a completed booking.",
            )
        if slot.booking_id is None and slot.status != AvailabilityStatus.BOOKED.value:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="There is no booking to complete.",
            )
