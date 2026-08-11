"""Payment totals, status rules, and history. All money math uses database values."""

from __future__ import annotations

from decimal import Decimal

from app.models.booking import (
    Booking,
    BookingStatus,
    InvoiceStatus,
    Payment,
    PaymentStatus,
)
from app.models.venue import VenuePricing
from app.services.booking_calculation_service import (
    PLATFORM_COMMISSION_PERCENT,
    BookingCalculationService,
    BookingSummary,
    money_round,
)

TERMINAL_BOOKING_STATUSES = {
    BookingStatus.CANCELLED.value,
    BookingStatus.COMPLETED.value,
    BookingStatus.REFUNDED.value,
    BookingStatus.REJECTED.value,
}


class PaymentService:
    def __init__(self, commission_percent: Decimal | None = None) -> None:
        self.commission_percent = (
            commission_percent if commission_percent is not None else PLATFORM_COMMISSION_PERCENT
        )
        self.calculator = BookingCalculationService(self.commission_percent)

    @staticmethod
    def commission_percent_from_pricing(pricing: VenuePricing | None) -> Decimal:
        extra = getattr(pricing, "extra", None) if pricing is not None else None
        if isinstance(extra, dict):
            raw = extra.get("platform_commission_percent", extra.get("commission_percent"))
            if raw is not None and str(raw).strip() != "":
                try:
                    value = Decimal(str(raw))
                    if value >= 0:
                        return value
                except Exception:
                    pass
        return PLATFORM_COMMISSION_PERCENT

    @classmethod
    def from_pricing(cls, pricing: VenuePricing | None) -> "PaymentService":
        return cls(cls.commission_percent_from_pricing(pricing))

    def calculate_gst(
        self, subtotal: Decimal, gst_percent: Decimal, gst_mode: str = "excluded"
    ) -> Decimal:
        subtotal = max(Decimal(subtotal or 0), Decimal("0"))
        gst_percent = Decimal(gst_percent or 0)
        if gst_mode == "included" or gst_percent <= 0 or subtotal <= 0:
            return Decimal("0")
        return money_round(subtotal * gst_percent / Decimal("100"))

    def calculate_booking_total(self, subtotal: Decimal, gst_extra: Decimal) -> Decimal:
        return max(Decimal(subtotal or 0), Decimal("0")) + max(Decimal(gst_extra or 0), Decimal("0"))

    def calculate_platform_commission(self, amount_received: Decimal) -> Decimal:
        received = max(Decimal(amount_received or 0), Decimal("0"))
        if received <= 0 or self.commission_percent <= 0:
            return Decimal("0")
        return money_round(received * self.commission_percent / Decimal("100"))

    def calculate_vendor_receivable(self, amount_received: Decimal, commission: Decimal) -> Decimal:
        return max(Decimal(amount_received or 0) - Decimal(commission or 0), Decimal("0"))

    def calculate_remaining_balance(self, booking_total: Decimal, amount_received: Decimal) -> Decimal:
        return max(Decimal(booking_total or 0) - Decimal(amount_received or 0), Decimal("0"))

    def calculate_booking_total_summary(
        self,
        *,
        venue_price: Decimal = Decimal("0"),
        food_total: Decimal = Decimal("0"),
        service_total: Decimal = Decimal("0"),
        gst_percent: Decimal = Decimal("0"),
        advance_percent: Decimal = Decimal("0"),
        gst_mode: str = "excluded",
        discount: Decimal = Decimal("0"),
        amount_received: Decimal | None = None,
    ) -> BookingSummary:
        return self.calculator.calculate_booking_summary(
            venue_price=venue_price,
            food_total=food_total,
            service_total=service_total,
            gst_percent=gst_percent,
            advance_percent=advance_percent,
            gst_mode=gst_mode,
            discount=discount,
            amount_received=amount_received,
        )

    def update_payment_status(self, paid_amount: Decimal, booking_total: Decimal) -> str:
        paid = Decimal(paid_amount or 0)
        total = Decimal(booking_total or 0)
        if paid <= 0:
            return PaymentStatus.PENDING.value
        if total > 0 and paid >= total:
            return PaymentStatus.PAID.value
        return PaymentStatus.PARTIAL.value

    def booking_status_for(self, booking: Booking) -> str:
        current = booking.booking_status
        if current in TERMINAL_BOOKING_STATUSES or current == BookingStatus.DRAFT.value:
            return current
        if booking.payment_status == PaymentStatus.REFUNDED.value:
            return BookingStatus.REFUNDED.value
        paid = Decimal(booking.paid_amount or 0)
        advance = Decimal(booking.advance_amount or 0)
        if paid <= 0:
            return current if current == BookingStatus.CONFIRMED.value else BookingStatus.PENDING.value
        if paid >= advance:
            return BookingStatus.CONFIRMED.value
        return BookingStatus.PENDING.value

    def apply_to_booking(
        self,
        booking: Booking,
        paid_amount: Decimal | None = None,
        invoices: list | None = None,
    ) -> Booking:
        paid = Decimal(booking.paid_amount or 0) if paid_amount is None else Decimal(paid_amount or 0)
        total = Decimal(booking.total_amount or 0)
        if paid < 0:
            paid = Decimal("0")
        if total > 0 and paid > total:
            paid = total
        commission = self.calculate_platform_commission(paid)
        booking.paid_amount = paid
        booking.platform_commission = commission
        booking.vendor_amount = self.calculate_vendor_receivable(paid, commission)
        booking.remaining_amount = self.calculate_remaining_balance(total, paid)
        if booking.payment_status not in {
            PaymentStatus.REFUNDED.value,
            PaymentStatus.FAILED.value,
            PaymentStatus.CANCELLED.value,
        }:
            booking.payment_status = self.update_payment_status(paid, total)
        if booking.booking_status not in TERMINAL_BOOKING_STATUSES:
            booking.booking_status = self.booking_status_for(booking)
        self.sync_invoices(booking, invoices=invoices)
        return booking

    def sync_invoices(self, booking: Booking, invoices: list | None = None) -> None:
        paid = Decimal(booking.paid_amount or 0)
        total = Decimal(booking.total_amount or 0)
        rows = invoices if invoices is not None else list(booking.invoices or [])
        for invoice in rows:
            if booking.payment_status == PaymentStatus.REFUNDED.value:
                continue
            if paid <= 0:
                if invoice.invoice_status == InvoiceStatus.PAID.value:
                    invoice.invoice_status = InvoiceStatus.GENERATED.value
            elif total > 0 and paid >= total:
                invoice.invoice_status = InvoiceStatus.PAID.value
            elif invoice.invoice_status == InvoiceStatus.PAID.value:
                invoice.invoice_status = InvoiceStatus.GENERATED.value

    def get_payment_history(self, booking: Booking) -> list[Payment]:
        rows = list(booking.payments or [])
        rows.sort(key=lambda item: item.paid_at or item.created_at)
        return rows
