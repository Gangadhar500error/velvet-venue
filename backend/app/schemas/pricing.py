import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.venue import (
    BookingPreviewResponse,
    FoodSlotInput,
    FoodSlotResponse,
    PricingInput,
    PricingResponse,
    PricingSlotInput,
    PricingSlotResponse,
)

PricingModeLiteral = Literal["full_day", "slot_based"]
PricingTypeLiteral = Literal["venue_only", "venue_food"]
ScheduleTypeLiteral = Literal[
    "standard",
    "weekday",
    "weekend",
    "seasonal",
    "holiday",
    "peak",
    "hourly",
]
PlateTypeLiteral = Literal["veg", "non_veg"]


def _as_uuid(value: uuid.UUID | str | None) -> uuid.UUID | None:
    if value is None:
        return None
    try:
        return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


class SlotWriteRequest(BaseModel):
    id: uuid.UUID | None = None
    key: str = "custom"
    name: str = Field(min_length=1, max_length=100)
    enabled: bool = True
    is_active: bool | None = None
    time_label: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    price: Decimal = Decimal("0")
    min_booking_amount: Decimal = Decimal("0")
    max_guests: int | None = None
    display_order: int | None = None
    extra: dict = Field(default_factory=dict)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Slot name is required.")
        return cleaned

    @model_validator(mode="after")
    def sync_enabled(self) -> "SlotWriteRequest":
        if self.is_active is not None:
            self.enabled = self.is_active
        return self


class FoodSlotWriteRequest(BaseModel):
    id: uuid.UUID | None = None
    key: str = "custom"
    name: str = Field(min_length=1, max_length=100)
    enabled: bool = True
    is_active: bool | None = None
    time_label: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    veg_plate_cost: Decimal = Decimal("0")
    non_veg_plate_cost: Decimal = Decimal("0")
    min_guests: int | None = None
    max_guests: int | None = None
    display_order: int | None = None
    extra: dict = Field(default_factory=dict)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Meal name is required.")
        return cleaned

    @model_validator(mode="after")
    def sync_enabled(self) -> "FoodSlotWriteRequest":
        if self.is_active is not None:
            self.enabled = self.is_active
        return self


class PricingWriteRequest(BaseModel):
    name: str | None = None
    schedule_type: ScheduleTypeLiteral = "standard"
    pricing_mode: PricingModeLiteral = "full_day"
    pricing_type: PricingTypeLiteral = "venue_only"
    gst_percent: Decimal = Decimal("18")
    gst_mode: str = "excluded"
    advance_percent: Decimal = Decimal("25")
    booking_window_days: int = 180
    booking_window_months: int | None = None
    minimum_notice_hours: int = 24
    operating_hours: str | None = None
    operating_start_time: time | None = None
    operating_end_time: time | None = None
    booking_confirmation: str = "manual"
    cancellation_preset: str | None = None
    valid_from: date | None = None
    valid_to: date | None = None
    is_active: bool = True
    extra: dict = Field(default_factory=dict)
    slots: list[SlotWriteRequest] | None = None
    food_slots: list[FoodSlotWriteRequest] | None = None

    @model_validator(mode="after")
    def resolve_window(self) -> "PricingWriteRequest":
        if self.booking_window_months is not None:
            self.booking_window_days = max(1, int(self.booking_window_months) * 30)
        return self


class PricingUpdateRequest(BaseModel):
    name: str | None = None
    schedule_type: ScheduleTypeLiteral | None = None
    pricing_mode: PricingModeLiteral | None = None
    pricing_type: PricingTypeLiteral | None = None
    gst_percent: Decimal | None = None
    gst_mode: str | None = None
    advance_percent: Decimal | None = None
    booking_window_days: int | None = None
    booking_window_months: int | None = None
    minimum_notice_hours: int | None = None
    operating_hours: str | None = None
    operating_start_time: time | None = None
    operating_end_time: time | None = None
    booking_confirmation: str | None = None
    cancellation_preset: str | None = None
    valid_from: date | None = None
    valid_to: date | None = None
    is_active: bool | None = None
    extra: dict | None = None
    slots: list[SlotWriteRequest] | None = None
    food_slots: list[FoodSlotWriteRequest] | None = None

    @model_validator(mode="after")
    def resolve_window(self) -> "PricingUpdateRequest":
        if self.booking_window_months is not None:
            self.booking_window_days = max(1, int(self.booking_window_months) * 30)
        return self


class SlotDetailResponse(PricingSlotResponse):
    start_time: time | None = None
    end_time: time | None = None
    is_active: bool = True
    extra: dict = Field(default_factory=dict)


class FoodSlotDetailResponse(FoodSlotResponse):
    start_time: time | None = None
    end_time: time | None = None
    is_active: bool = True
    extra: dict = Field(default_factory=dict)


class PricingDetailResponse(PricingResponse):
    venue_id: uuid.UUID | None = None
    name: str | None = None
    schedule_type: str = "standard"
    booking_window_months: int = 6
    operating_start_time: time | None = None
    operating_end_time: time | None = None
    valid_from: date | None = None
    valid_to: date | None = None
    is_active: bool = True
    extra: dict = Field(default_factory=dict)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    slots: list[SlotDetailResponse] = Field(default_factory=list)
    food_slots: list[FoodSlotDetailResponse] = Field(default_factory=list)


class PricingMutationResponse(BaseModel):
    success: bool = True
    message: str
    pricing: PricingDetailResponse


class SlotMutationResponse(BaseModel):
    success: bool = True
    message: str
    slot: SlotDetailResponse


class FoodSlotMutationResponse(BaseModel):
    success: bool = True
    message: str
    food_slot: FoodSlotDetailResponse


class PricingPreviewQuery(BaseModel):
    slot_id: uuid.UUID | None = None
    slot_key: str | None = None
    food_slot_id: uuid.UUID | None = None
    food_meal_key: str | None = None
    guests: int = Field(default=100, ge=1)
    plate_type: PlateTypeLiteral = "veg"


class BookingWindowCheckRequest(BaseModel):
    start_at: datetime
    end_at: datetime | None = None


class BookingWindowCheckResponse(BaseModel):
    success: bool = True
    allowed: bool
    message: str


class MessageResponse(BaseModel):
    success: bool = True
    message: str


__all__ = [
    "BookingPreviewResponse",
    "BookingWindowCheckRequest",
    "BookingWindowCheckResponse",
    "FoodSlotDetailResponse",
    "FoodSlotInput",
    "FoodSlotMutationResponse",
    "FoodSlotResponse",
    "FoodSlotWriteRequest",
    "MessageResponse",
    "PricingDetailResponse",
    "PricingInput",
    "PricingMutationResponse",
    "PricingPreviewQuery",
    "PricingResponse",
    "PricingSlotInput",
    "PricingSlotResponse",
    "PricingUpdateRequest",
    "PricingWriteRequest",
    "SlotDetailResponse",
    "SlotMutationResponse",
    "SlotWriteRequest",
    "_as_uuid",
]
