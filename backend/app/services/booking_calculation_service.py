"""Reusable booking amount engine. Never persist calculated values."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

PLATFORM_COMMISSION_PERCENT = Decimal("2")


def money_round(value: Decimal) -> Decimal:
    return value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class BookingSummary:
    venue_price: Decimal
    food_total: Decimal
    subtotal: Decimal
    gst_extra: Decimal
    booking_total: Decimal
    advance_payable: Decimal
    platform_commission: Decimal
    vendor_receivable: Decimal
    remaining_balance: Decimal
    gst_percent: Decimal
    advance_percent: Decimal
    platform_commission_percent: Decimal

    def as_floats(self) -> dict[str, float]:
        return {
            "venue_price": float(self.venue_price),
            "food_total": float(self.food_total),
            "subtotal": float(self.subtotal),
            "gst_extra": float(self.gst_extra),
            "booking_total": float(self.booking_total),
            "advance_payable": float(self.advance_payable),
            "platform_commission": float(self.platform_commission),
            "vendor_receivable": float(self.vendor_receivable),
            "remaining_balance": float(self.remaining_balance),
            "gst_percent": float(self.gst_percent),
            "advance_percent": float(self.advance_percent),
            "platform_commission_percent": float(self.platform_commission_percent),
        }


class BookingCalculationService:
    def __init__(self, commission_percent: Decimal = PLATFORM_COMMISSION_PERCENT) -> None:
        self.commission_percent = commission_percent

    def calculate_booking_summary(
        self,
        *,
        venue_price: Decimal = Decimal("0"),
        food_total: Decimal = Decimal("0"),
        service_total: Decimal = Decimal("0"),
        gst_percent: Decimal = Decimal("0"),
        advance_percent: Decimal = Decimal("0"),
        gst_mode: str = "excluded",
        discount: Decimal = Decimal("0"),
    ) -> BookingSummary:
        venue_price = Decimal(venue_price or 0)
        food_total = Decimal(food_total or 0)
        service_total = Decimal(service_total or 0)
        gst_percent = Decimal(gst_percent or 0)
        advance_percent = Decimal(advance_percent or 0)
        discount = max(Decimal(discount or 0), Decimal("0"))
        subtotal = max(venue_price + food_total + service_total - discount, Decimal("0"))
        if gst_mode == "included":
            gst_extra = Decimal("0")
        else:
            gst_extra = (
                money_round(subtotal * gst_percent / Decimal("100"))
                if gst_percent > 0 and subtotal > 0
                else Decimal("0")
            )
        booking_total = subtotal + gst_extra
        advance = min(
            money_round(booking_total * advance_percent / Decimal("100"))
            if advance_percent > 0 and booking_total > 0
            else Decimal("0"),
            booking_total,
        )
        commission = money_round(advance * self.commission_percent / Decimal("100"))
        vendor = max(advance - commission, Decimal("0"))
        remaining = max(booking_total - advance, Decimal("0"))
        return BookingSummary(
            venue_price=venue_price,
            food_total=food_total,
            subtotal=subtotal,
            gst_extra=gst_extra,
            booking_total=booking_total,
            advance_payable=advance,
            platform_commission=commission,
            vendor_receivable=vendor,
            remaining_balance=remaining,
            gst_percent=gst_percent,
            advance_percent=advance_percent,
            platform_commission_percent=self.commission_percent,
        )

    def calculate_full_day(
        self,
        venue_price: Decimal,
        *,
        gst_percent: Decimal,
        advance_percent: Decimal,
    ) -> BookingSummary:
        return self.calculate_booking_summary(
            venue_price=venue_price,
            gst_percent=gst_percent,
            advance_percent=advance_percent,
        )

    def calculate_slot(
        self,
        slot_price: Decimal,
        *,
        gst_percent: Decimal,
        advance_percent: Decimal,
    ) -> BookingSummary:
        return self.calculate_booking_summary(
            venue_price=slot_price,
            gst_percent=gst_percent,
            advance_percent=advance_percent,
        )

    def calculate_food(
        self,
        plate_price: Decimal,
        guests: int,
        *,
        gst_percent: Decimal,
        advance_percent: Decimal,
    ) -> BookingSummary:
        food_total = Decimal(plate_price or 0) * Decimal(guests)
        return self.calculate_booking_summary(
            food_total=food_total,
            gst_percent=gst_percent,
            advance_percent=advance_percent,
        )
