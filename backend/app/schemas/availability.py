import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

AvailabilityStatusLiteral = Literal[
    "available",
    "booked",
    "partially_booked",
    "blocked",
    "holiday",
    "closed",
    "completed",
    "cancelled",
    "no_booking",
    "expired",
]
BlockReasonLiteral = Literal[
    "maintenance",
    "private_event",
    "holiday",
    "personal_use",
    "renovation",
    "emergency",
]
RecurrenceLiteral = Literal["none", "weekly", "monthly", "yearly"]


class SlotAvailabilityResponse(BaseModel):
    id: uuid.UUID
    slot_id: uuid.UUID | None = None
    food_slot_id: uuid.UUID | None = None
    slot_kind: str
    slot_key: str
    slot_name: str
    time_label: str | None = None
    status: str
    booking_id: uuid.UUID | None = None
    booking_ref: str | None = None
    customer_name: str | None = None
    event_type: str | None = None
    guests: int | None = None
    blocked_reason: str | None = None


class DayAvailabilityResponse(BaseModel):
    id: uuid.UUID
    date: date
    status: str
    available_capacity: int = 0
    booked_capacity: int = 0
    available_slots: int = 0
    booked_slots: int = 0
    booking_count: int = 0
    occupancy: int = 0
    holiday: bool = False
    blocked: bool = False
    notes: str | None = None
    is_manual_override: bool = False
    slots: list[SlotAvailabilityResponse] = Field(default_factory=list)


class AvailabilityDashboard(BaseModel):
    available_days: int = 0
    booked_days: int = 0
    completed_days: int = 0
    blocked_days: int = 0
    occupancy_percent: int = 0
    todays_bookings: int = 0


class AvailabilityMonthResponse(BaseModel):
    success: bool = True
    venue_id: uuid.UUID
    month: str
    pricing_mode: str = "full_day"
    pricing_type: str = "venue_only"
    operating_hours: str | None = None
    booking_window_days: int = 180
    minimum_notice_hours: int = 24
    days: list[DayAvailabilityResponse] = Field(default_factory=list)
    dashboard: AvailabilityDashboard = Field(default_factory=AvailabilityDashboard)


class AvailabilityListResponse(BaseModel):
    success: bool = True
    venue_id: uuid.UUID
    items: list[DayAvailabilityResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    dashboard: AvailabilityDashboard = Field(default_factory=AvailabilityDashboard)


class AvailabilityDayDetailResponse(BaseModel):
    success: bool = True
    venue_id: uuid.UUID
    venue_name: str
    booking_type: str
    pricing_mode: str
    operating_hours: str | None = None
    day: DayAvailabilityResponse
    occupancy: int = 0
    vendor_notes: str | None = None


class BlockCreateRequest(BaseModel):
    start_date: date
    end_date: date | None = None
    dates: list[date] | None = None
    slot_id: uuid.UUID | None = None
    food_slot_id: uuid.UUID | None = None
    reason: BlockReasonLiteral = "maintenance"
    notes: str | None = None
    recurrence_type: RecurrenceLiteral = "none"
    recurrence_interval: int = Field(default=1, ge=1, le=12)
    weekdays: list[int] = Field(default_factory=list)
    nth_weekday: int | None = Field(default=None, ge=1, le=5)
    recurrence_end_date: date | None = None

    @model_validator(mode="after")
    def normalize_range(self) -> "BlockCreateRequest":
        if self.dates:
            ordered = sorted(self.dates)
            self.start_date = ordered[0]
            self.end_date = ordered[-1]
        elif self.end_date is None:
            self.end_date = self.start_date
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date.")
        return self


class BlockUpdateRequest(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    slot_id: uuid.UUID | None = None
    food_slot_id: uuid.UUID | None = None
    reason: BlockReasonLiteral | None = None
    notes: str | None = None
    recurrence_type: RecurrenceLiteral | None = None
    recurrence_interval: int | None = Field(default=None, ge=1, le=12)
    weekdays: list[int] | None = None
    nth_weekday: int | None = None
    recurrence_end_date: date | None = None
    is_active: bool | None = None


class BlockResponse(BaseModel):
    id: uuid.UUID
    venue_id: uuid.UUID
    start_date: date
    end_date: date
    slot_id: uuid.UUID | None = None
    food_slot_id: uuid.UUID | None = None
    reason: str
    notes: str | None = None
    recurrence_type: str
    recurrence_interval: int
    weekdays: list[int] = Field(default_factory=list)
    nth_weekday: int | None = None
    recurrence_end_date: date | None = None
    is_active: bool
    created_at: datetime


class BlockMutationResponse(BaseModel):
    success: bool = True
    message: str
    block: BlockResponse


class BookingHoldRequest(BaseModel):
    event_date: date
    slot_id: uuid.UUID | None = None
    food_slot_id: uuid.UUID | None = None
    slot_key: str | None = None
    booking_id: uuid.UUID
    booking_ref: str | None = None
    customer_name: str | None = None
    event_type: str | None = None
    guests: int | None = None


class MessageResponse(BaseModel):
    success: bool = True
    message: str
