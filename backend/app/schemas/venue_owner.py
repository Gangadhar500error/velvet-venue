import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


RegistrationSourceLiteral = Literal["website", "referral", "admin", "mobile_app"]
StatusLiteral = Literal["active", "inactive", "pending", "deleted"]
VerificationLiteral = Literal["pending", "verified", "rejected"]
GenderLiteral = Literal["male", "female", "other", "prefer_not_to_say"]
SortByLiteral = Literal["name", "registration_date", "businesses", "venues", "revenue"]
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
        return "VO"
    return "".join(p[0] for p in parts[:2]).upper()


class VenueOwnerCreateRequest(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    name: str | None = Field(default=None, max_length=200)
    email: EmailStr
    mobile: str = Field(..., min_length=7, max_length=20)
    alternate_mobile: str | None = None
    gender: GenderLiteral | None = None
    date_of_birth: date | None = None
    profile_image: str | None = None
    business_name: str | None = None
    business_type: str | None = None
    registration_source: RegistrationSourceLiteral = "admin"
    status: StatusLiteral = "pending"
    verification_status: VerificationLiteral = "pending"
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    business_registration_number: str | None = None
    website: str | None = None
    description: str | None = None
    return_existing: bool = True

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
    def normalize_alternate(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        return "".join(ch for ch in str(value).strip() if ch.isdigit() or ch == "+")

    @model_validator(mode="after")
    def resolve_names(self) -> "VenueOwnerCreateRequest":
        if self.name and not (self.first_name or self.last_name):
            first, last = _split_name(self.name)
            self.first_name = first
            self.last_name = last
        if not self.first_name:
            raise ValueError("first_name or name is required")
        if self.last_name is None:
            self.last_name = ""
        return self


class VenueOwnerUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None
    email: EmailStr | None = None
    mobile: str | None = None
    alternate_mobile: str | None = None
    gender: GenderLiteral | None = None
    date_of_birth: date | None = None
    profile_image: str | None = None
    business_name: str | None = None
    business_type: str | None = None
    status: StatusLiteral | None = None
    verification_status: VerificationLiteral | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    business_registration_number: str | None = None
    website: str | None = None
    description: str | None = None

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


class VenueOwnerListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    mobile: str
    business_name: str | None
    business_type: str | None
    city: str | None
    country: str | None
    status: str
    verification_status: str
    registration_source: str
    profile_image: str | None
    created_at: datetime
    business_profiles_count: int = 0
    venues_count: int = 0
    bookings_count: int = 0
    revenue: float = 0.0
    initials: str = ""


class VenueOwnerListResponse(BaseModel):
    success: bool = True
    items: list[VenueOwnerListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class VenueOwnerOverview(BaseModel):
    business_profiles_count: int = 0
    venues_count: int = 0
    total_bookings: int = 0
    revenue: float = 0.0
    pending_payments: float = 0.0
    completed_events: int = 0
    upcoming_events: int = 0
    verification_status: str = "pending"


class BusinessProfileSummary(BaseModel):
    id: uuid.UUID
    business_name: str
    business_type: str | None = None
    city: str | None = None
    status: str


class VenueSummary(BaseModel):
    id: uuid.UUID
    name: str
    venue_type: str | None = None
    capacity: int | None = None
    city: str | None = None
    status: str


class BookingSummary(BaseModel):
    id: uuid.UUID
    booking_code: str
    customer_name: str
    venue_name: str
    event_date: date | None = None
    amount: float = 0.0
    status: str


class VenueOwnerDetailResponse(BaseModel):
    success: bool = True
    id: uuid.UUID
    owner_code: str
    user_id: uuid.UUID
    first_name: str
    last_name: str
    full_name: str
    email: str
    mobile: str
    alternate_mobile: str | None
    gender: str | None
    date_of_birth: date | None
    profile_image: str | None
    business_name: str | None
    business_type: str | None
    registration_source: str
    verification_status: str
    status: str
    address_line1: str | None
    address_line2: str | None
    city: str | None
    state: str | None
    country: str | None
    postal_code: str | None
    gst_number: str | None = None
    pan_number: str | None = None
    business_registration_number: str | None = None
    website: str | None = None
    description: str | None = None
    member_since: datetime
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None
    initials: str
    overview: VenueOwnerOverview
    business_profiles: list[BusinessProfileSummary] = Field(default_factory=list)
    venues: list[VenueSummary] = Field(default_factory=list)
    recent_bookings: list[BookingSummary] = Field(default_factory=list)
    existed: bool = False


class VenueOwnerMutationResponse(BaseModel):
    success: bool = True
    message: str
    venue_owner: VenueOwnerDetailResponse
    existed: bool = False


class MessageResponse(BaseModel):
    success: bool = True
    message: str
