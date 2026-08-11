from datetime import time
from decimal import Decimal

import pytest

from app.services.booking_calculation_service import BookingCalculationService
from app.services.pricing_validation import (
    FoodValidationService,
    PricingValidationError,
    SlotLike,
    SlotValidationService,
)


def test_full_day_matches_frontend_preview():
    summary = BookingCalculationService().calculate_full_day(
        Decimal("50000"),
        gst_percent=Decimal("18"),
        advance_percent=Decimal("25"),
    )
    assert summary.gst_extra == Decimal("9000")
    assert summary.booking_total == Decimal("59000")
    assert summary.advance_payable == Decimal("14750")
    assert summary.platform_commission == Decimal("295")
    assert summary.vendor_receivable == Decimal("14455")
    assert summary.remaining_balance == Decimal("44250")


def test_food_calculation():
    summary = BookingCalculationService().calculate_food(
        Decimal("650"),
        100,
        gst_percent=Decimal("18"),
        advance_percent=Decimal("25"),
    )
    assert summary.food_total == Decimal("65000")
    assert summary.booking_total == Decimal("76700")


def test_slot_overlap_rejected():
    with pytest.raises(PricingValidationError):
        SlotValidationService().validate_collection(
            [
                SlotLike(
                    name="Morning",
                    start_time=time(9, 0),
                    end_time=time(13, 0),
                    price=Decimal("1000"),
                ),
                SlotLike(
                    name="Brunch",
                    start_time=time(11, 0),
                    end_time=time(14, 0),
                    price=Decimal("1000"),
                ),
            ],
            pricing_mode="slot_based",
        )


def test_food_min_max_guests():
    with pytest.raises(PricingValidationError):
        FoodValidationService().validate_collection(
            [
                SlotLike(
                    name="Lunch",
                    veg_price=Decimal("500"),
                    non_veg_price=Decimal("600"),
                    min_guests=200,
                    max_guests=50,
                )
            ]
        )
