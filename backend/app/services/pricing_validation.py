"""Pricing / slot / food / booking-window validation. No persistence."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time
from decimal import Decimal

from fastapi import HTTPException

from app.utils.time_ranges import parse_time_range, ranges_overlap


class PricingValidationError(HTTPException):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=422, detail=message)


@dataclass
class SlotLike:
    name: str
    enabled: bool = True
    start_time: time | None = None
    end_time: time | None = None
    time_label: str | None = None
    price: Decimal = Decimal("0")
    veg_price: Decimal = Decimal("0")
    non_veg_price: Decimal = Decimal("0")
    min_guests: int | None = None
    max_guests: int | None = None


def _resolved_times(item: SlotLike) -> tuple[time | None, time | None]:
    start, end = item.start_time, item.end_time
    if start is None or end is None:
        parsed_start, parsed_end = parse_time_range(item.time_label)
        start = start or parsed_start
        end = end or parsed_end
    return start, end


class PricingValidationService:
    def validate_rates(
        self,
        *,
        gst_percent: Decimal,
        advance_percent: Decimal,
    ) -> None:
        if gst_percent < 0 or gst_percent > 100:
            raise PricingValidationError("GST must be between 0 and 100.")
        if advance_percent < 1 or advance_percent > 100:
            raise PricingValidationError("Minimum booking percentage must be between 1 and 100.")

    def validate_operating_hours(
        self,
        start: time | None,
        end: time | None,
    ) -> None:
        if start and end and end <= start:
            raise PricingValidationError("Operating end time must be after start time.")

    def validate_booking_window(
        self,
        *,
        start_at: datetime,
        operating_start: time | None,
        operating_end: time | None,
        minimum_notice_hours: int,
        booking_window_days: int,
        now: datetime | None = None,
    ) -> None:
        current = now or datetime.now(tz=start_at.tzinfo)
        if start_at <= current:
            raise PricingValidationError("Booking start must be in the future.")
        notice = (start_at - current).total_seconds() / 3600
        if minimum_notice_hours and notice < minimum_notice_hours:
            raise PricingValidationError(
                f"Bookings require at least {minimum_notice_hours} hours notice."
            )
        window_hours = booking_window_days * 24
        if booking_window_days and notice > window_hours:
            raise PricingValidationError(
                f"Bookings cannot be made more than {booking_window_days} days in advance."
            )
        if operating_start and operating_end:
            clock = start_at.timetz().replace(tzinfo=None) if start_at.tzinfo else start_at.time()
            if clock < operating_start or clock > operating_end:
                raise PricingValidationError("Booking time is outside venue operating hours.")


class SlotValidationService:
    def validate_collection(
        self,
        slots: list[SlotLike],
        *,
        pricing_mode: str,
        require_positive_price: bool = True,
    ) -> None:
        active = [s for s in slots if s.enabled]
        names: set[str] = set()
        timed: list[tuple[str, time, time]] = []
        for slot in active:
            key = slot.name.strip().lower()
            if key in names:
                raise PricingValidationError(
                    f"Duplicate slot name '{slot.name}' is not allowed."
                )
            names.add(key)
            start, end = _resolved_times(slot)
            if start and end:
                if end <= start:
                    raise PricingValidationError(
                        f"End time must be after start time for slot '{slot.name}'."
                    )
                for other_name, other_start, other_end in timed:
                    if ranges_overlap(start, end, other_start, other_end):
                        raise PricingValidationError(
                            f"Slot '{slot.name}' overlaps '{other_name}'."
                        )
                timed.append((slot.name, start, end))
            if require_positive_price and slot.price <= 0:
                raise PricingValidationError(f"Slot '{slot.name}' price must be greater than 0.")

        if pricing_mode == "full_day" and len(active) > 1:
            raise PricingValidationError("Full day pricing allows only one price.")


class FoodValidationService:
    def validate_collection(
        self,
        slots: list[SlotLike],
        *,
        require_positive_price: bool = True,
    ) -> None:
        active = [s for s in slots if s.enabled]
        names: set[str] = set()
        timed: list[tuple[str, time, time]] = []
        for slot in active:
            key = slot.name.strip().lower()
            if key in names:
                raise PricingValidationError(
                    f"Duplicate meal name '{slot.name}' is not allowed."
                )
            names.add(key)
            start, end = _resolved_times(slot)
            if start and end:
                if end <= start:
                    raise PricingValidationError(
                        f"End time must be after start time for meal '{slot.name}'."
                    )
                for other_name, other_start, other_end in timed:
                    if ranges_overlap(start, end, other_start, other_end):
                        raise PricingValidationError(
                            f"Meal '{slot.name}' overlaps '{other_name}'."
                        )
                timed.append((slot.name, start, end))
            if slot.min_guests is not None and slot.max_guests is not None:
                if slot.min_guests > slot.max_guests:
                    raise PricingValidationError(
                        f"Minimum guests cannot exceed maximum guests for '{slot.name}'."
                    )
            if require_positive_price:
                if slot.veg_price <= 0 and slot.non_veg_price <= 0:
                    raise PricingValidationError(
                        f"Meal '{slot.name}' must have a veg or non-veg price greater than 0."
                    )
