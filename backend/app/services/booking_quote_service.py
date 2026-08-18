from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.models.venue import Venue, VenueFoodSlot, VenuePricing, VenueSlot
from app.schemas.booking import DateSlotInput, FoodSelectionInput, ServiceSelectionInput
from app.services.booking_calculation_service import BookingCalculationService, BookingSummary
from app.services.payment_service import PaymentService
from app.utils.time_ranges import format_clock, parse_time_range


@dataclass
class QuotedSlot:
    slot: VenueSlot
    event_date: date
    price: Decimal


@dataclass
class QuotedFood:
    food: VenueFoodSlot
    event_date: date
    veg_count: int
    nonveg_count: int
    subtotal: Decimal


@dataclass
class QuotedService:
    name: str
    price: Decimal
    quantity: int
    subtotal: Decimal


@dataclass
class BookingQuote:
    dates: list[date]
    booking_type: str
    booking_mode: str
    slots: list[QuotedSlot] = field(default_factory=list)
    foods: list[QuotedFood] = field(default_factory=list)
    services: list[QuotedService] = field(default_factory=list)
    venue_price: Decimal = Decimal("0")
    food_total: Decimal = Decimal("0")
    service_total: Decimal = Decimal("0")
    summary: BookingSummary | None = None


class BookingQuoteService:
    def __init__(self) -> None:
        self.calculator = BookingCalculationService()

    def _enabled_slots(self, pricing: VenuePricing) -> list[VenueSlot]:
        return [s for s in (pricing.slots or []) if s.enabled and s.deleted_at is None]

    def _enabled_foods(self, pricing: VenuePricing) -> list[VenueFoodSlot]:
        return [s for s in (pricing.food_slots or []) if s.enabled and s.deleted_at is None]

    def resolve_slots(
        self,
        pricing: VenuePricing,
        *,
        slot_ids: list,
        slot_keys: list[str],
        booking_mode: str,
    ) -> list[VenueSlot]:
        slots = self._enabled_slots(pricing)
        if booking_mode == "full_day":
            found = next((s for s in slots if s.slot_key == "full_day"), None)
            return [found] if found else slots[:1]
        selected: list[VenueSlot] = []
        seen: set = set()
        for slot_id in slot_ids:
            match = next((s for s in slots if s.id == slot_id), None)
            if match and match.id not in seen:
                selected.append(match)
                seen.add(match.id)
        for key in slot_keys:
            match = next((s for s in slots if s.slot_key == key), None)
            if match and match.id not in seen:
                selected.append(match)
                seen.add(match.id)
        return [s for s in selected if s.slot_key != "full_day"] or selected

    def resolve_foods(
        self, pricing: VenuePricing, selections: list[FoodSelectionInput]
    ) -> list[tuple[VenueFoodSlot, FoodSelectionInput]]:
        foods = self._enabled_foods(pricing)
        resolved: list[tuple[VenueFoodSlot, FoodSelectionInput]] = []
        seen: set = set()
        for item in selections:
            match = None
            if item.food_slot_id:
                match = next((s for s in foods if s.id == item.food_slot_id), None)
            if match is None and item.meal_key:
                match = next((s for s in foods if s.meal_key == item.meal_key), None)
            if match is None or match.id in seen:
                continue
            seen.add(match.id)
            resolved.append((match, item))
        return resolved

    def build(
        self,
        venue: Venue,
        pricing: VenuePricing,
        *,
        dates: list[date],
        booking_type: str,
        booking_mode: str,
        slot_ids: list,
        slot_keys: list[str],
        food_slots: list[FoodSelectionInput],
        services: list[ServiceSelectionInput],
        discount: Decimal = Decimal("0"),
        date_slots: list[DateSlotInput] | None = None,
        amount_received: Decimal | None = None,
    ) -> BookingQuote:
        calculator = BookingCalculationService(
            PaymentService.commission_percent_from_pricing(pricing)
        )
        quote = BookingQuote(
            dates=dates,
            booking_type=booking_type,
            booking_mode=booking_mode,
        )
        if booking_type == "venue_food":
            quote.slots = []
            quote.venue_price = Decimal("0")
        elif date_slots:
            dated = [item for item in date_slots if item.event_date]
            extra_dates = [item.event_date for item in dated if item.event_date not in quote.dates]
            if extra_dates:
                quote.dates = sorted(set(quote.dates + extra_dates))
            for item in dated:
                venue_slots = self.resolve_slots(
                    pricing,
                    slot_ids=item.slot_ids,
                    slot_keys=item.slot_keys,
                    booking_mode=booking_mode,
                )
                for slot in venue_slots:
                    quote.slots.append(
                        QuotedSlot(
                            slot=slot,
                            event_date=item.event_date,
                            price=Decimal(slot.slot_price or 0),
                        )
                    )
            quote.venue_price = sum((item.price for item in quote.slots), Decimal("0"))
        else:
            venue_slots = self.resolve_slots(
                pricing, slot_ids=slot_ids, slot_keys=slot_keys, booking_mode=booking_mode
            )
            for event_date in quote.dates:
                for slot in venue_slots:
                    quote.slots.append(
                        QuotedSlot(
                            slot=slot, event_date=event_date, price=Decimal(slot.slot_price or 0)
                        )
                    )
            quote.venue_price = sum((item.price for item in quote.slots), Decimal("0"))

        if booking_type == "venue_food":
            for event_date in quote.dates:
                for food, selection in self.resolve_foods(pricing, food_slots):
                    veg = int(selection.veg_count or 0)
                    nonveg = int(selection.nonveg_count or 0)
                    subtotal = (Decimal(food.veg_plate_price or 0) * veg) + (
                        Decimal(food.non_veg_plate_price or 0) * nonveg
                    )
                    quote.foods.append(
                        QuotedFood(
                            food=food,
                            event_date=event_date,
                            veg_count=veg,
                            nonveg_count=nonveg,
                            subtotal=subtotal,
                        )
                    )
            quote.food_total = sum((item.subtotal for item in quote.foods), Decimal("0"))
        else:
            quote.foods = []
            quote.food_total = Decimal("0")

        for service in services:
            qty = max(int(service.quantity or 1), 1)
            price = Decimal(service.price or 0)
            quote.services.append(
                QuotedService(
                    name=service.name.strip(),
                    price=price,
                    quantity=qty,
                    subtotal=price * qty,
                )
            )
        quote.service_total = sum((item.subtotal for item in quote.services), Decimal("0"))
        quote.summary = calculator.calculate_booking_summary(
            venue_price=quote.venue_price,
            food_total=quote.food_total,
            service_total=quote.service_total,
            gst_percent=Decimal(pricing.gst_percent or 0),
            advance_percent=Decimal(pricing.advance_percent or 0),
            gst_mode=pricing.gst_mode or "excluded",
            discount=discount,
            amount_received=amount_received,
        )
        return quote

    def slot_clocks(self, slot: VenueSlot) -> tuple[str | None, str | None]:
        start, end = slot.start_time, slot.end_time
        if start is None or end is None:
            parsed = parse_time_range(slot.time_label)
            start = start or parsed[0]
            end = end or parsed[1]
        return (
            format_clock(start) if start else None,
            format_clock(end) if end else None,
        )
