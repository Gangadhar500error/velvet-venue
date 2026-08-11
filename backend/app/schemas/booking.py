import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

BookingTypeLiteral = Literal["venue_only", "venue_food"]
BookingModeLiteral = Literal["full_day", "slot_based"]
BookingStatusLiteral = Literal[
    "draft",
    "pending",
    "confirmed",
    "checked_in",
    "cancelled",
    "completed",
    "refunded",
    "rejected",
]
PaymentStatusLiteral = Literal["pending", "partial", "paid", "refunded", "failed"]
ApprovalLiteral = Literal["pending", "approved", "rejected"]
SortByLiteral = Literal["created_at", "event_date", "booking_number", "total_amount"]
SortDirLiteral = Literal["asc", "desc"]


class FoodSelectionInput(BaseModel):
    food_slot_id: uuid.UUID | None = None
    meal_key: str | None = None
    veg_count: int = Field(default=0, ge=0)
    nonveg_count: int = Field(default=0, ge=0)


class ServiceSelectionInput(BaseModel):
    name: str
    price: Decimal = Decimal("0")
    quantity: int = Field(default=1, ge=1)


class BookingCreateRequest(BaseModel):
    venue_id: uuid.UUID
    customer_id: uuid.UUID | None = None
    event_date: date
    event_end_date: date | None = None
    selected_dates: list[date] = Field(default_factory=list)
    booking_type: BookingTypeLiteral | None = None
    booking_mode: BookingModeLiteral | None = None
    event_type: str | None = None
    guest_count: int = Field(default=0, ge=0)
    special_note: str | None = None
    slot_ids: list[uuid.UUID] = Field(default_factory=list)
    slot_keys: list[str] = Field(default_factory=list)
    food_slots: list[FoodSelectionInput] = Field(default_factory=list)
    services: list[ServiceSelectionInput] = Field(default_factory=list)
    discount: Decimal = Decimal("0")
    booking_status: BookingStatusLiteral | None = None
    assigned_executive: str | None = None
    payment_method: str | None = None
    notes: str | None = None

    @field_validator("slot_keys")
    @classmethod
    def clean_keys(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]

    @model_validator(mode="after")
    def normalize_dates(self) -> "BookingCreateRequest":
        dates = list(self.selected_dates or [])
        if self.event_date and self.event_date not in dates:
            dates.append(self.event_date)
        if self.event_end_date:
            cursor = self.event_date
            while cursor <= self.event_end_date:
                if cursor not in dates:
                    dates.append(cursor)
                cursor = date.fromordinal(cursor.toordinal() + 1)
        self.selected_dates = sorted(set(dates))
        if self.selected_dates:
            self.event_date = self.selected_dates[0]
            self.event_end_date = self.selected_dates[-1]
        if self.special_note is None and self.notes:
            self.special_note = self.notes
        return self


class BookingQuoteResponse(BaseModel):
    success: bool = True
    venue_price: float = 0
    food_cost: float = 0
    services_total: float = 0
    subtotal: float = 0
    gst_amount: float = 0
    discount: float = 0
    grand_total: float = 0
    advance: float = 0
    remaining: float = 0
    commission: float = 0
    vendor_amount: float = 0
    gst_percent: float = 0
    advance_percent: float = 0
    currency: str = "INR"


class BookingUpdateRequest(BaseModel):
    event_type: str | None = None
    guest_count: int | None = Field(default=None, ge=0)
    special_note: str | None = None
    assigned_executive: str | None = None
    payment_method: str | None = None
    discount: Decimal | None = None
    booking_status: BookingStatusLiteral | None = None
    notes: str | None = None


class PaymentCreateRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    payment_type: Literal["advance", "installment", "final", "refund"] = "advance"
    gateway: str | None = None
    transaction_id: str | None = None
    payment_method: str | None = None
    remarks: str | None = None
    collected_by: str | None = None
    paid_at: datetime | None = None


class RejectRequest(BaseModel):
    reason: str | None = None


class CancelRequest(BaseModel):
    reason: str | None = None


class BookingSlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    venue_slot_id: uuid.UUID | None = None
    event_date: date | None = None
    slot_key: str | None = None
    slot_name: str
    slot_price: float
    start_time: str | None = None
    end_time: str | None = None
    status: str


class BookingFoodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    food_slot_id: uuid.UUID | None = None
    event_date: date | None = None
    meal_key: str | None = None
    meal_name: str
    veg_price: float
    nonveg_price: float
    veg_count: int
    nonveg_count: int
    subtotal: float
    status: str


class BookingServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    service_name: str
    price: float
    quantity: int
    subtotal: float


class BookingDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: date
    status: str


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    invoice_number: str | None = None
    payment_reference: str
    transaction_id: str | None = None
    gateway: str | None = None
    amount: float
    payment_type: str
    status: str
    paid_at: datetime | None = None
    remarks: str | None = None
    collected_by: str | None = None
    created_at: datetime


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    invoice_number: str
    invoice_type: str
    invoice_status: str
    amount: float
    gst_amount: float
    pdf_url: str | None = None
    issued_at: datetime | None = None
    created_at: datetime


class TimelineItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    action: str
    description: str
    created_by: uuid.UUID | None = None
    created_at: datetime


class NestedPerson(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    code: str | None = None


class NestedVenue(BaseModel):
    id: uuid.UUID
    venue_code: str
    venue_name: str
    city: str | None = None
    category: str | None = None
    seating_capacity: int | None = None
    maximum_guests: int | None = None


class NestedBusiness(BaseModel):
    id: uuid.UUID
    business_name: str
    business_type: str | None = None


class PaymentSummary(BaseModel):
    subtotal: float = 0
    gst_amount: float = 0
    discount: float = 0
    total_amount: float = 0
    advance_percentage: float = 0
    advance_amount: float = 0
    paid_amount: float = 0
    remaining_amount: float = 0
    platform_commission: float = 0
    vendor_amount: float = 0
    currency: str = "INR"
    gst_percent: float = 0
    gst_mode: str = "excluded"
    payment_status: str = "pending"


class BookingListItem(BaseModel):
    id: uuid.UUID
    booking_number: str
    customer_id: uuid.UUID
    customer_name: str
    customer_phone: str | None = None
    customer_email: str | None = None
    vendor_id: uuid.UUID
    vendor_name: str
    business_profile_id: uuid.UUID
    business_name: str
    venue_id: uuid.UUID
    venue_name: str
    venue_city: str | None = None
    event_type: str | None = None
    booking_type: str
    booking_mode: str
    booking_status: str
    payment_status: str
    approval_status: str
    booking_date: date
    start_date: date
    end_date: date
    guest_count: int
    total_amount: float
    paid_amount: float
    remaining_amount: float
    currency: str
    created_at: datetime
    updated_at: datetime


class BookingListResponse(BaseModel):
    success: bool = True
    items: list[BookingListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class BookingDetailResponse(BaseModel):
    success: bool = True
    id: uuid.UUID
    booking_number: str
    booking_type: str
    booking_mode: str
    event_type: str | None
    booking_status: str
    payment_status: str
    approval_status: str
    booking_date: date
    start_date: date
    end_date: date
    guest_count: int
    special_note: str | None
    assigned_executive: str | None = None
    payment_method: str | None = None
    currency: str
    customer: NestedPerson
    vendor: NestedPerson
    business_profile: NestedBusiness
    venue: NestedVenue
    days: list[BookingDayResponse] = Field(default_factory=list)
    slots: list[BookingSlotResponse] = Field(default_factory=list)
    food_slots: list[BookingFoodResponse] = Field(default_factory=list)
    services: list[BookingServiceResponse] = Field(default_factory=list)
    payment_summary: PaymentSummary
    invoices: list[InvoiceResponse] = Field(default_factory=list)
    payments: list[PaymentResponse] = Field(default_factory=list)
    timeline: list[TimelineItem] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None = None
    updated_by: uuid.UUID | None = None


class BookingMutationResponse(BaseModel):
    success: bool = True
    message: str
    booking: BookingDetailResponse


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class RemainingSlot(BaseModel):
    slot_id: uuid.UUID | None = None
    food_slot_id: uuid.UUID | None = None
    slot_key: str
    slot_name: str
    slot_kind: str
    status: str
    start_time: str | None = None
    end_time: str | None = None
    price: float | None = None


class AvailabilityCheckResponse(BaseModel):
    success: bool = True
    venue_id: uuid.UUID
    date: date
    day_status: str
    bookable: bool
    remaining_slots: list[RemainingSlot] = Field(default_factory=list)
    remaining_food_slots: list[RemainingSlot] = Field(default_factory=list)


class CalendarBookingItem(BaseModel):
    id: uuid.UUID
    booking_number: str
    customer_name: str
    venue_id: uuid.UUID
    venue_name: str
    event_date: date
    booking_status: str
    payment_status: str
    slot_names: list[str] = Field(default_factory=list)
    total_amount: float


class BookingCalendarResponse(BaseModel):
    success: bool = True
    venue_id: uuid.UUID | None = None
    month: str
    days: list[dict] = Field(default_factory=list)
    bookings: list[CalendarBookingItem] = Field(default_factory=list)
