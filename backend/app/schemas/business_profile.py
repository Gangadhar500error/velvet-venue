import re
import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

StatusLiteral = Literal["active", "inactive", "pending"]
VerificationLiteral = Literal["verified", "pending", "rejected"]
DocumentStatusLiteral = Literal[
    "uploaded", "pending", "verified", "rejected", "suspended"
]
SortByLiteral = Literal[
    "business_name", "created_at", "venue_count", "booking_count", "name"
]
SortDirLiteral = Literal["asc", "desc"]

IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
PHONE_RE = re.compile(r"^\+?[0-9]{7,15}$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)


def _initials(name: str) -> str:
    parts = [p for p in (name or "").split() if p]
    if not parts:
        return "BP"
    chars = "".join(p[0] for p in parts[:2])
    return chars.upper()


def _clean_phone(value: str | None) -> str | None:
    if value is None or not str(value).strip():
        return None
    cleaned = "".join(ch for ch in str(value).strip() if ch.isdigit() or ch == "+")
    if cleaned and not PHONE_RE.match(cleaned):
        raise ValueError("Invalid phone number format.")
    return cleaned or None


class DocumentInput(BaseModel):
    id: uuid.UUID | None = None
    name: str
    document_type: str | None = None
    status: DocumentStatusLiteral = "pending"
    file_name: str | None = None
    file_size: str | None = None
    file_url: str | None = None
    verified_by: str | None = None
    uploaded_date: date | None = None


class BankAccountInput(BaseModel):
    id: uuid.UUID | None = None
    account_holder_name: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    cancelled_cheque_url: str | None = None
    bank_proof_file_name: str | None = None
    bank_proof_file_size: str | None = None
    bank_proof_uploaded_date: date | None = None
    is_primary: bool = False
    sort_order: int = 0

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        cleaned = str(value).strip().upper()
        if not IFSC_RE.match(cleaned):
            raise ValueError("Invalid IFSC format.")
        return cleaned

    @field_validator(
        "account_holder_name",
        "bank_name",
        "account_number",
        "cancelled_cheque_url",
        "bank_proof_file_name",
        "bank_proof_file_size",
    )
    @classmethod
    def normalize_optional(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        return str(value).strip()


class BusinessProfileCreateRequest(BaseModel):
    venue_owner_id: uuid.UUID
    business_name: str = Field(min_length=1, max_length=200)
    legal_business_name: str = Field(min_length=1, max_length=200)
    business_type: str = Field(min_length=1, max_length=100)
    years_in_business: int | None = Field(default=None, ge=0, le=200)
    description: str | None = None
    website: str | None = None
    support_email: EmailStr | None = None
    support_phone: str | None = None
    alternate_phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    business_registration_number: str | None = None
    account_holder_name: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    cancelled_cheque_url: str | None = None
    bank_proof_file_name: str | None = None
    bank_proof_file_size: str | None = None
    bank_proof_uploaded_date: date | None = None
    verification_status: VerificationLiteral = "pending"
    verification_notes: str | None = None
    status: StatusLiteral = "pending"
    documents: list[DocumentInput] = Field(default_factory=list)
    bank_accounts: list[BankAccountInput] = Field(default_factory=list)

    @field_validator("business_name", "legal_business_name", "business_type")
    @classmethod
    def required_trimmed(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required.")
        return cleaned

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        cleaned = value.strip()
        if not URL_RE.match(cleaned):
            raise ValueError("Website must start with http:// or https://")
        return cleaned

    @field_validator("support_phone", "alternate_phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return _clean_phone(value)

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        cleaned = str(value).strip().upper()
        if not IFSC_RE.match(cleaned):
            raise ValueError("Invalid IFSC format.")
        return cleaned

    @field_validator("gst_number", "pan_number", "business_registration_number")
    @classmethod
    def normalize_legal(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        return str(value).strip().upper()


class BusinessProfileUpdateRequest(BaseModel):
    business_name: str | None = Field(default=None, min_length=1, max_length=200)
    legal_business_name: str | None = Field(default=None, min_length=1, max_length=200)
    business_type: str | None = Field(default=None, min_length=1, max_length=100)
    years_in_business: int | None = Field(default=None, ge=0, le=200)
    description: str | None = None
    website: str | None = None
    support_email: EmailStr | None = None
    support_phone: str | None = None
    alternate_phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    business_registration_number: str | None = None
    account_holder_name: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    cancelled_cheque_url: str | None = None
    bank_proof_file_name: str | None = None
    bank_proof_file_size: str | None = None
    bank_proof_uploaded_date: date | None = None
    verification_status: VerificationLiteral | None = None
    verification_notes: str | None = None
    status: StatusLiteral | None = None
    documents: list[DocumentInput] | None = None
    bank_accounts: list[BankAccountInput] | None = None

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        cleaned = str(value).strip()
        if not URL_RE.match(cleaned):
            raise ValueError("Website must start with http:// or https://")
        return cleaned

    @field_validator("support_phone", "alternate_phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return _clean_phone(value)

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        cleaned = str(value).strip().upper()
        if not IFSC_RE.match(cleaned):
            raise ValueError("Invalid IFSC format.")
        return cleaned

    @field_validator("gst_number", "pan_number", "business_registration_number")
    @classmethod
    def normalize_legal(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        return str(value).strip().upper()

    @model_validator(mode="after")
    def strip_names(self) -> "BusinessProfileUpdateRequest":
        if self.business_name is not None:
            self.business_name = self.business_name.strip()
        if self.legal_business_name is not None:
            self.legal_business_name = self.legal_business_name.strip()
        if self.business_type is not None:
            self.business_type = self.business_type.strip()
        return self


class BusinessProfileListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_code: str
    business_name: str
    legal_business_name: str
    business_type: str
    city: str | None
    status: str
    verification_status: str
    venue_owner_id: uuid.UUID
    owner_name: str
    owner_email: str
    owner_phone: str
    gst_number: str | None = None
    support_email: str | None = None
    support_phone: str | None = None
    address_line1: str | None = None
    state: str | None = None
    pan_number: str | None = None
    created_at: datetime
    total_venues: int = 0
    initials: str = ""


class BusinessProfileListResponse(BaseModel):
    success: bool = True
    items: list[BusinessProfileListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class BusinessOverview(BaseModel):
    total_venues: int = 0
    published_venues: int = 0
    pending_venues: int = 0
    inactive_venues: int = 0
    draft_venues: int = 0
    total_bookings: int = 0
    revenue: float = 0.0
    upcoming_events: int = 0
    verification_status: str = "pending"
    business_type: str = ""
    created_at: datetime | None = None


class VenueSummary(BaseModel):
    id: uuid.UUID
    venue_code: str
    name: str
    category: str | None = None
    capacity: int | None = None
    city: str | None = None
    status: str
    rating: float = 0.0
    bookings: int = 0


class BookingSummary(BaseModel):
    id: uuid.UUID
    booking_code: str
    customer_name: str
    venue_name: str
    event_date: date | None = None
    amount: float = 0.0
    status: str


class DocumentResponse(BaseModel):
    id: uuid.UUID
    name: str
    document_type: str
    status: str
    file_name: str | None = None
    file_size: str | None = None
    file_url: str | None = None
    verified_by: str | None = None
    uploaded_date: date | None = None


class BankAccountResponse(BaseModel):
    id: uuid.UUID
    account_holder_name: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    cancelled_cheque_url: str | None = None
    bank_proof_file_name: str | None = None
    bank_proof_file_size: str | None = None
    bank_proof_uploaded_date: date | None = None
    is_primary: bool = False
    sort_order: int = 0


class BusinessProfileDetailResponse(BaseModel):
    success: bool = True
    id: uuid.UUID
    business_code: str
    venue_owner_id: uuid.UUID
    business_name: str
    legal_business_name: str
    business_type: str
    years_in_business: int | None
    description: str | None
    website: str | None
    support_email: str | None
    support_phone: str | None
    alternate_phone: str | None
    address_line1: str | None
    address_line2: str | None
    city: str | None
    state: str | None
    country: str | None
    postal_code: str | None
    gst_number: str | None
    pan_number: str | None
    business_registration_number: str | None
    account_holder_name: str | None
    bank_name: str | None
    account_number: str | None
    ifsc_code: str | None
    cancelled_cheque_url: str | None
    bank_proof_file_name: str | None
    bank_proof_file_size: str | None
    bank_proof_uploaded_date: date | None = None
    verification_status: str
    verification_notes: str | None
    status: str
    published_at: datetime | None
    owner_name: str
    owner_email: str
    owner_phone: str
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None
    initials: str
    overview: BusinessOverview
    venues: list[VenueSummary] = Field(default_factory=list)
    recent_bookings: list[BookingSummary] = Field(default_factory=list)
    documents: list[DocumentResponse] = Field(default_factory=list)
    bank_accounts: list[BankAccountResponse] = Field(default_factory=list)


class BusinessProfileMutationResponse(BaseModel):
    success: bool = True
    message: str
    business_profile: BusinessProfileDetailResponse


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class DocumentUploadResponse(BaseModel):
    success: bool = True
    message: str
    document: DocumentResponse
