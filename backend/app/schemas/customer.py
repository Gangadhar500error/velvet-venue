import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


RegistrationSourceLiteral = Literal[
    "website", "mobile_app", "admin", "vendor", "referral", "partner"
]
CustomerStatusLiteral = Literal["active", "inactive", "blocked", "pending", "deleted"]
VerificationStatusLiteral = Literal["pending", "verified", "rejected"]
CustomerTypeLiteral = Literal["individual", "corporate"]
GenderLiteral = Literal["male", "female", "other", "prefer_not_to_say"]
SortByLiteral = Literal["name", "registration_date", "bookings", "lifetime_spend"]
SortDirLiteral = Literal["asc", "desc"]


def _split_name(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _initials(full_name: str) -> str:
    parts = [p for p in full_name.strip().split() if p]
    if not parts:
        return "CU"
    return "".join(p[0] for p in parts[:2]).upper()


class CustomerCreateRequest(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    name: str | None = Field(default=None, max_length=200, description="Full name shortcut")
    email: EmailStr
    mobile: str = Field(..., min_length=7, max_length=20)
    alternate_mobile: str | None = Field(default=None, max_length=20)
    gender: GenderLiteral | None = None
    date_of_birth: date | None = None
    profile_image: str | None = None
    registration_source: RegistrationSourceLiteral = "admin"
    customer_type: CustomerTypeLiteral = "individual"
    status: CustomerStatusLiteral = "active"
    verification_status: VerificationStatusLiteral = "pending"
    email_verified: bool = False
    mobile_verified: bool = False
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    notes: str | None = None
    communication_preference: str = "email"
    return_existing: bool = Field(
        default=True,
        description="If true, return existing customer on email/mobile match instead of 409",
    )

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower().strip()

    @field_validator("mobile")
    @classmethod
    def normalize_mobile_required(cls, value: str) -> str:
        cleaned = "".join(ch for ch in str(value).strip() if ch.isdigit() or ch == "+")
        if len(cleaned) < 7:
            raise ValueError("mobile must be at least 7 digits")
        return cleaned

    @field_validator("alternate_mobile")
    @classmethod
    def normalize_alternate_mobile(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        return "".join(ch for ch in str(value).strip() if ch.isdigit() or ch == "+")

    @model_validator(mode="after")
    def resolve_names(self) -> "CustomerCreateRequest":
        if self.name and not (self.first_name or self.last_name):
            first, last = _split_name(self.name)
            self.first_name = first
            self.last_name = last
        if not self.first_name:
            raise ValueError("first_name or name is required")
        if self.last_name is None:
            self.last_name = ""
        return self


class CustomerUpdateRequest(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    name: str | None = Field(default=None, max_length=200)
    email: EmailStr | None = None
    mobile: str | None = Field(default=None, min_length=7, max_length=20)
    alternate_mobile: str | None = Field(default=None, max_length=20)
    gender: GenderLiteral | None = None
    date_of_birth: date | None = None
    profile_image: str | None = None
    status: CustomerStatusLiteral | None = None
    verification_status: VerificationStatusLiteral | None = None
    email_verified: bool | None = None
    mobile_verified: bool | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    notes: str | None = None
    communication_preference: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.lower().strip() if value else value

    @field_validator("mobile", "alternate_mobile")
    @classmethod
    def normalize_mobile(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        return "".join(ch for ch in str(value).strip() if ch.isdigit() or ch == "+")


class CustomerListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    customer_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    mobile: str
    city: str | None
    country: str | None
    status: str
    verification_status: str
    email_verified: bool
    mobile_verified: bool
    registration_source: str
    customer_type: str
    profile_image: str | None
    created_at: datetime
    # Computed (default 0 until booking module exists)
    bookings: int = 0
    lifetime_spend: float = 0.0
    last_booking_date: date | None = None
    initials: str = ""


class CustomerListResponse(BaseModel):
    success: bool = True
    items: list[CustomerListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class CustomerOverview(BaseModel):
    total_bookings: int = 0
    upcoming_bookings: int = 0
    completed_bookings: int = 0
    cancelled_bookings: int = 0
    lifetime_spend: float = 0.0
    total_paid: float = 0.0
    pending_amount: float = 0.0
    average_rating: float = 0.0
    last_booking_date: date | None = None
    average_booking: float = 0.0
    reviews_count: int = 0


class CustomerBookingSummary(BaseModel):
    id: uuid.UUID
    booking_code: str
    venue_name: str
    event_type: str
    booking_date: date | None
    event_date: date | None
    guests: int = 0
    amount: float = 0.0
    payment_status: str
    booking_status: str


class CustomerInvoiceSummary(BaseModel):
    id: uuid.UUID
    invoice_number: str
    amount: float
    status: str
    issued_at: datetime | None


class CustomerReviewSummary(BaseModel):
    id: uuid.UUID
    venue_name: str
    rating: float
    comment: str
    created_at: datetime
    reply: str | None = None


class CustomerDetailResponse(BaseModel):
    success: bool = True
    id: uuid.UUID
    customer_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    mobile: str
    alternate_mobile: str | None
    gender: str | None
    date_of_birth: date | None
    profile_image: str | None
    registration_source: str
    customer_type: str
    email_verified: bool
    mobile_verified: bool
    verification_status: str
    status: str
    address_line1: str | None
    address_line2: str | None
    city: str | None
    state: str | None
    country: str | None
    postal_code: str | None
    notes: str | None
    communication_preference: str
    member_since: datetime
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None
    user_id: uuid.UUID | None = None
    initials: str
    overview: CustomerOverview
    recent_bookings: list[CustomerBookingSummary] = Field(default_factory=list)
    recent_invoices: list[CustomerInvoiceSummary] = Field(default_factory=list)
    reviews: list[CustomerReviewSummary] = Field(default_factory=list)
    existed: bool = False


class CustomerMutationResponse(BaseModel):
    success: bool = True
    message: str
    customer: CustomerDetailResponse
    existed: bool = False


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class FindOrCreateCustomerRequest(BaseModel):
    email: EmailStr | None = None
    mobile: str | None = None
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    registration_source: RegistrationSourceLiteral = "admin"

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.lower().strip() if value else value

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        return "".join(ch for ch in str(value).strip() if ch.isdigit() or ch == "+")

    @model_validator(mode="after")
    def require_contact(self) -> "FindOrCreateCustomerRequest":
        if not self.email and not self.mobile:
            raise ValueError("email or mobile is required")
        return self
