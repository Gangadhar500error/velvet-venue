import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

VenueStatusLiteral = Literal["published", "draft", "pending", "inactive", "archived"]
ApprovalLiteral = Literal["approved", "pending", "rejected"]
AvailabilityLiteral = Literal["available", "busy", "blocked"]
PricingModeLiteral = Literal["full_day", "slot_based"]
PricingTypeLiteral = Literal["venue_only", "venue_food"]
SortByLiteral = Literal["venue_name", "created_at", "city", "capacity", "name"]
SortDirLiteral = Literal["asc", "desc"]


def _initials(name: str) -> str:
    parts = [p for p in (name or "").split() if p]
    if not parts:
        return "VN"
    return "".join(p[0] for p in parts[:2]).upper()


class PricingSlotInput(BaseModel):
    id: uuid.UUID | str | None = None
    key: str = "custom"
    name: str
    enabled: bool = True
    time_label: str | None = None
    price: Decimal = Decimal("0")
    min_booking_amount: Decimal = Decimal("0")
    max_guests: int | None = None
    display_order: int = 0


class FoodSlotInput(BaseModel):
    id: uuid.UUID | str | None = None
    key: str = "custom"
    name: str
    enabled: bool = True
    time_label: str | None = None
    veg_plate_cost: Decimal = Decimal("0")
    non_veg_plate_cost: Decimal = Decimal("0")
    min_guests: int | None = None
    max_guests: int | None = None
    display_order: int = 0


class PricingInput(BaseModel):
    pricing_mode: PricingModeLiteral = "full_day"
    pricing_type: PricingTypeLiteral = "venue_only"
    gst_percent: Decimal = Decimal("18")
    gst_mode: str = "excluded"
    advance_percent: Decimal = Decimal("25")
    booking_window_days: int = 180
    minimum_notice_hours: int = 24
    operating_hours: str | None = None
    booking_confirmation: str = "manual"
    cancellation_preset: str | None = None
    slots: list[PricingSlotInput] = Field(default_factory=list)
    food_slots: list[FoodSlotInput] = Field(default_factory=list)


class GalleryItemInput(BaseModel):
    id: uuid.UUID | None = None
    image_url: str
    thumbnail_url: str | None = None
    title: str | None = None
    image_type: str = "gallery"
    media_type: str = "image"
    is_cover: bool = False
    caption: str | None = None
    display_order: int = 0


class DocumentInput(BaseModel):
    id: uuid.UUID | None = None
    name: str
    document_type: str | None = None
    status: str = "pending"
    file_name: str | None = None
    file_size: str | None = None
    file_url: str | None = None
    verified_by: str | None = None
    expiry_date: date | None = None
    verified_at: datetime | None = None
    uploaded_date: date | None = None


class VenueCreateRequest(BaseModel):
    business_profile_id: uuid.UUID
    venue_name: str = Field(min_length=1, max_length=200)
    category: str | None = None
    venue_type: str | None = None
    short_description: str | None = None
    description: str | None = None
    house_rules: str | None = None
    highlights: str | None = None
    featured: bool = False
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    latitude: str | None = None
    longitude: str | None = None
    google_map_url: str | None = None
    landmark: str | None = None
    minimum_guests: int | None = None
    maximum_guests: int | None = None
    seating_capacity: int | None = None
    dining_capacity: int | None = None
    floating_capacity: int | None = None
    venue_status: VenueStatusLiteral = "draft"
    approval_status: ApprovalLiteral = "pending"
    availability_status: AvailabilityLiteral = "available"
    operating_hours: str | None = None
    weekly_off: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    contact_person: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    support_email: str | None = None
    support_phone: str | None = None
    notes: str | None = None
    smoking_policy: str | None = None
    alcohol_policy: str | None = None
    outside_catering: bool = False
    outside_decorations: bool = False
    outside_photography: bool = False
    pets_allowed: bool = False
    cancellation_policy: str | None = None
    refund_policy: str | None = None
    cover_image_url: str | None = None
    video_url: str | None = None
    amenities: list[str] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    event_categories: list[str] = Field(default_factory=list)
    pricing: PricingInput | None = None
    gallery: list[GalleryItemInput] = Field(default_factory=list)
    documents: list[DocumentInput] = Field(default_factory=list)

    @field_validator("venue_name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Venue name is required.")
        return cleaned


class VenueUpdateRequest(BaseModel):
    venue_name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = None
    venue_type: str | None = None
    short_description: str | None = None
    description: str | None = None
    house_rules: str | None = None
    highlights: str | None = None
    featured: bool | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    latitude: str | None = None
    longitude: str | None = None
    google_map_url: str | None = None
    landmark: str | None = None
    minimum_guests: int | None = None
    maximum_guests: int | None = None
    seating_capacity: int | None = None
    dining_capacity: int | None = None
    floating_capacity: int | None = None
    venue_status: VenueStatusLiteral | None = None
    approval_status: ApprovalLiteral | None = None
    availability_status: AvailabilityLiteral | None = None
    operating_hours: str | None = None
    weekly_off: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    contact_person: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    support_email: str | None = None
    support_phone: str | None = None
    notes: str | None = None
    smoking_policy: str | None = None
    alcohol_policy: str | None = None
    outside_catering: bool | None = None
    outside_decorations: bool | None = None
    outside_photography: bool | None = None
    pets_allowed: bool | None = None
    cancellation_policy: str | None = None
    refund_policy: str | None = None
    cover_image_url: str | None = None
    video_url: str | None = None
    amenities: list[str] | None = None
    services: list[str] | None = None
    event_categories: list[str] | None = None
    pricing: PricingInput | None = None
    gallery: list[GalleryItemInput] | None = None
    documents: list[DocumentInput] | None = None


class VenueListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    venue_code: str
    venue_name: str
    category: str | None
    venue_type: str | None
    city: str | None
    venue_status: str
    approval_status: str
    availability_status: str
    seating_capacity: int | None
    maximum_guests: int | None
    business_profile_id: uuid.UUID
    business_name: str
    owner_name: str
    featured: bool
    cover_image_url: str | None = None
    starting_price: float = 0.0
    rating: float = 0.0
    total_bookings: int = 0
    created_at: datetime
    initials: str = ""


class VenueListResponse(BaseModel):
    success: bool = True
    items: list[VenueListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class VenueSearchItem(BaseModel):
    id: uuid.UUID
    venue_code: str
    venue_name: str
    business_name: str
    city: str | None = None
    category: str | None = None
    pricing_mode: str | None = None
    availability_status: str


class VenueSearchResponse(BaseModel):
    success: bool = True
    items: list[VenueSearchItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class VenueOverview(BaseModel):
    todays_bookings: int = 0
    upcoming_events: int = 0
    revenue: float = 0.0
    average_rating: float = 0.0
    reviews_count: int = 0
    availability_status: str = "available"
    opening_hours: str | None = None


class PricingSlotResponse(BaseModel):
    id: uuid.UUID
    key: str
    name: str
    enabled: bool
    time_label: str | None
    price: float
    min_booking_amount: float
    max_guests: int | None
    display_order: int


class FoodSlotResponse(BaseModel):
    id: uuid.UUID
    key: str
    name: str
    enabled: bool
    time_label: str | None
    veg_plate_cost: float
    non_veg_plate_cost: float
    min_guests: int | None
    max_guests: int | None
    display_order: int


class PricingResponse(BaseModel):
    id: uuid.UUID | None = None
    pricing_mode: str = "full_day"
    pricing_type: str = "venue_only"
    gst_percent: float = 18.0
    gst_mode: str = "excluded"
    advance_percent: float = 25.0
    booking_window_days: int = 180
    minimum_notice_hours: int = 24
    operating_hours: str | None = None
    booking_confirmation: str = "manual"
    cancellation_preset: str | None = None
    slots: list[PricingSlotResponse] = Field(default_factory=list)
    food_slots: list[FoodSlotResponse] = Field(default_factory=list)


class GalleryItemResponse(BaseModel):
    id: uuid.UUID
    image_url: str
    thumbnail_url: str | None = None
    title: str | None = None
    image_type: str
    media_type: str = "image"
    is_cover: bool = False
    caption: str | None = None
    display_order: int = 0


class DocumentResponse(BaseModel):
    id: uuid.UUID
    name: str
    document_type: str
    status: str
    file_name: str | None = None
    file_size: str | None = None
    file_url: str | None = None
    verified_by: str | None = None
    expiry_date: date | None = None
    verified_at: datetime | None = None
    uploaded_date: date | None = None


class AmenityItem(BaseModel):
    id: uuid.UUID
    name: str
    icon: str | None = None
    category: str | None = None


class ServiceItem(BaseModel):
    id: uuid.UUID
    name: str
    icon: str | None = None
    description: str | None = None


class EventCategoryItem(BaseModel):
    id: uuid.UUID
    name: str


class BusinessProfileNested(BaseModel):
    id: uuid.UUID
    business_name: str
    business_type: str | None = None
    logo: str | None = None
    verified: bool = False


class OwnerNested(BaseModel):
    id: uuid.UUID | None = None
    name: str = ""
    email: str = ""
    phone: str = ""


class LocationNested(BaseModel):
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    latitude: str | None = None
    longitude: str | None = None
    google_map_url: str | None = None
    landmark: str | None = None


class CapacitiesNested(BaseModel):
    minimum_guests: int | None = None
    maximum_guests: int | None = None
    seating_capacity: int | None = None
    dining_capacity: int | None = None
    floating_capacity: int | None = None


class ContactNested(BaseModel):
    contact_person: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    support_email: str | None = None
    support_phone: str | None = None


class PoliciesNested(BaseModel):
    smoking_policy: str | None = None
    alcohol_policy: str | None = None
    outside_catering: bool = False
    outside_decorations: bool = False
    outside_photography: bool = False
    pets_allowed: bool = False
    cancellation_policy: str | None = None
    refund_policy: str | None = None


class StatisticsNested(BaseModel):
    todays_bookings: int = 0
    upcoming_events: int = 0
    completed_events: int = 0
    cancelled_events: int = 0
    occupancy_percentage: int = 0
    revenue: float = 0.0
    average_rating: float = 0.0
    review_count: int = 0


class BookingSummary(BaseModel):
    today_bookings: int = 0
    upcoming_bookings: int = 0
    completed_bookings: int = 0
    cancelled_bookings: int = 0


class AvailabilityStatusNested(BaseModel):
    label: str = "available"
    today: str | None = None
    occupancy_percentage: int = 0
    available_days: int = 0
    booked_days: int = 0
    blocked_days: int = 0


class AvailabilitySlotNested(BaseModel):
    slot_id: uuid.UUID | None = None
    food_slot_id: uuid.UUID | None = None
    slot_name: str
    slot_key: str
    slot_kind: str = "venue"
    status: str
    start_time: str | None = None
    end_time: str | None = None
    price: float | None = None


class AvailabilityDayNested(BaseModel):
    date: date
    status: str
    slots: list[AvailabilitySlotNested] = Field(default_factory=list)


class ReviewItem(BaseModel):
    id: uuid.UUID
    customer_name: str
    rating: int
    comment: str | None = None
    event_type: str | None = None
    created_at: datetime
    reply: str | None = None


class ReviewsBlock(BaseModel):
    average_rating: float = 0.0
    total_reviews: int = 0
    items: list[ReviewItem] = Field(default_factory=list)


class FaqItem(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    display_order: int = 0


class SeoBlock(BaseModel):
    title: str | None = None
    description: str | None = None
    keywords: str | None = None
    canonical: str | None = None


class RelatedVenueItem(BaseModel):
    id: uuid.UUID
    venue_code: str
    venue_name: str
    city: str | None = None
    category: str | None = None
    cover_image_url: str | None = None
    starting_price: float = 0.0
    rating: float = 0.0


class VenueDetailResponse(BaseModel):
    success: bool = True
    id: uuid.UUID
    venue_code: str
    business_profile_id: uuid.UUID
    business_name: str
    owner_id: uuid.UUID | None = None
    owner_name: str
    owner_email: str
    owner_phone: str
    venue_name: str
    category: str | None
    venue_type: str | None
    short_description: str | None
    description: str | None
    house_rules: str | None
    highlights: str | None
    featured: bool
    address_line1: str | None
    address_line2: str | None
    city: str | None
    state: str | None
    country: str | None
    postal_code: str | None
    latitude: str | None
    longitude: str | None
    google_map_url: str | None
    landmark: str | None
    minimum_guests: int | None
    maximum_guests: int | None
    seating_capacity: int | None
    dining_capacity: int | None
    floating_capacity: int | None
    venue_status: str
    approval_status: str
    availability_status: str
    operating_hours: str | None
    weekly_off: str | None
    check_in_time: str | None
    check_out_time: str | None
    contact_person: str | None
    contact_phone: str | None
    contact_email: str | None
    support_email: str | None
    support_phone: str | None
    notes: str | None
    smoking_policy: str | None
    alcohol_policy: str | None
    outside_catering: bool
    outside_decorations: bool
    outside_photography: bool
    pets_allowed: bool
    cancellation_policy: str | None
    refund_policy: str | None
    cover_image_url: str | None
    video_url: str | None
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None
    initials: str
    status: str | None = None
    business_profile: BusinessProfileNested | None = None
    owner: OwnerNested | None = None
    location: LocationNested | None = None
    capacities: CapacitiesNested | None = None
    contact: ContactNested | None = None
    policies: PoliciesNested | None = None
    statistics: StatisticsNested | None = None
    overview: VenueOverview
    amenities: list[AmenityItem] = Field(default_factory=list)
    services: list[ServiceItem] = Field(default_factory=list)
    event_categories: list[EventCategoryItem] = Field(default_factory=list)
    pricing: PricingResponse
    gallery: list[GalleryItemResponse] = Field(default_factory=list)
    documents: list[DocumentResponse] = Field(default_factory=list)
    bookings: list = Field(default_factory=list)
    booking_summary: BookingSummary = Field(default_factory=BookingSummary)
    reviews: ReviewsBlock = Field(default_factory=ReviewsBlock)
    availability: list[AvailabilityDayNested] = Field(default_factory=list)
    availability_status_detail: AvailabilityStatusNested | None = None
    related_venues: list[RelatedVenueItem] = Field(default_factory=list)
    similar_venues: list[RelatedVenueItem] = Field(default_factory=list)
    faqs: list[FaqItem] = Field(default_factory=list)
    seo: SeoBlock | None = None


class VenueMutationResponse(BaseModel):
    success: bool = True
    message: str
    venue: VenueDetailResponse


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class BookingPreviewRequest(BaseModel):
    slot_key: str | None = None
    food_meal_key: str | None = None
    guests: int = Field(default=100, ge=1)
    plate_type: Literal["veg", "non_veg"] = "veg"


class BookingPreviewResponse(BaseModel):
    success: bool = True
    venue_price: float
    food_total: float
    subtotal: float
    gst_extra: float
    booking_total: float
    advance_payable: float
    platform_commission: float
    vendor_receivable: float
    remaining_balance: float
    gst_percent: float
    advance_percent: float
    platform_commission_percent: float = 2.0
