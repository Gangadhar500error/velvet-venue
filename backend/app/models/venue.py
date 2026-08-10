import enum
import uuid
from datetime import datetime, time
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class VenueStatus(str, enum.Enum):
    PUBLISHED = "published"
    DRAFT = "draft"
    PENDING = "pending"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    DELETED = "deleted"


class VenueApprovalStatus(str, enum.Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"


class VenueAvailabilityStatus(str, enum.Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    BLOCKED = "blocked"


class PricingMode(str, enum.Enum):
    FULL_DAY = "full_day"
    SLOT_BASED = "slot_based"


class PricingType(str, enum.Enum):
    VENUE_ONLY = "venue_only"
    VENUE_WITH_FOOD = "venue_food"


class Venue(Base):
    __tablename__ = "venues"
    __table_args__ = (
        Index("ix_venues_tenant_created", "tenant_id", "created_at"),
        UniqueConstraint("venue_code", name="uq_venues_venue_code"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    venue_code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    venue_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    venue_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    house_rules: Mapped[str | None] = mapped_column(Text, nullable=True)
    highlights: Mapped[str | None] = mapped_column(Text, nullable=True)
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    latitude: Mapped[str | None] = mapped_column(String(50), nullable=True)
    longitude: Mapped[str | None] = mapped_column(String(50), nullable=True)
    google_map_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    landmark: Mapped[str | None] = mapped_column(String(255), nullable=True)

    minimum_guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    maximum_guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seating_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dining_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    floating_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    venue_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=VenueStatus.DRAFT.value, index=True
    )
    approval_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=VenueApprovalStatus.PENDING.value,
        index=True,
    )
    availability_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=VenueAvailabilityStatus.AVAILABLE.value,
        index=True,
    )

    operating_hours: Mapped[str | None] = mapped_column(String(100), nullable=True)
    weekly_off: Mapped[str | None] = mapped_column(String(50), nullable=True)
    check_in_time: Mapped[str | None] = mapped_column(String(20), nullable=True)
    check_out_time: Mapped[str | None] = mapped_column(String(20), nullable=True)
    contact_person: Mapped[str | None] = mapped_column(String(150), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    smoking_policy: Mapped[str | None] = mapped_column(String(100), nullable=True)
    alcohol_policy: Mapped[str | None] = mapped_column(String(100), nullable=True)
    outside_catering: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    outside_decorations: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    outside_photography: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pets_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    cancellation_policy: Mapped[str | None] = mapped_column(Text, nullable=True)
    refund_policy: Mapped[str | None] = mapped_column(Text, nullable=True)

    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejected_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    business_profile: Mapped["BusinessProfile"] = relationship(  # noqa: F821
        "BusinessProfile", foreign_keys=[business_profile_id], lazy="selectin"
    )
    pricing: Mapped["VenuePricing | None"] = relationship(
        "VenuePricing",
        back_populates="venue",
        uselist=False,
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    gallery_items: Mapped[list["VenueGalleryItem"]] = relationship(
        "VenueGalleryItem",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="VenueGalleryItem.display_order",
    )
    documents: Mapped[list["VenueDocument"]] = relationship(
        "VenueDocument",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    amenity_links: Mapped[list["VenueAmenityMapping"]] = relationship(
        "VenueAmenityMapping",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    service_links: Mapped[list["VenueServiceMapping"]] = relationship(
        "VenueServiceMapping",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    event_links: Mapped[list["VenueEventMapping"]] = relationship(
        "VenueEventMapping",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class VenueAmenity(Base):
    __tablename__ = "venue_amenities"
    __table_args__ = (UniqueConstraint("code", name="uq_venue_amenities_code"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class VenueAmenityMapping(Base):
    __tablename__ = "venue_amenity_mapping"
    __table_args__ = (
        UniqueConstraint("venue_id", "amenity_id", name="uq_venue_amenity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amenity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_amenities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="amenity_links")
    amenity: Mapped["VenueAmenity"] = relationship("VenueAmenity", lazy="selectin")


class VenueService(Base):
    __tablename__ = "venue_services"
    __table_args__ = (UniqueConstraint("code", name="uq_venue_services_code"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class VenueServiceMapping(Base):
    __tablename__ = "venue_service_mapping"
    __table_args__ = (
        UniqueConstraint("venue_id", "service_id", name="uq_venue_service"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="service_links")
    service: Mapped["VenueService"] = relationship("VenueService", lazy="selectin")


class EventType(Base):
    __tablename__ = "event_types"
    __table_args__ = (UniqueConstraint("code", name="uq_event_types_code"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class VenueEventMapping(Base):
    __tablename__ = "venue_event_mapping"
    __table_args__ = (
        UniqueConstraint("venue_id", "event_type_id", name="uq_venue_event"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("event_types.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="event_links")
    event_type: Mapped["EventType"] = relationship("EventType", lazy="selectin")


class VenueDocument(Base):
    __tablename__ = "venue_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    verified_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    uploaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="documents")


class VenueGalleryItem(Base):
    __tablename__ = "venue_gallery"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    image_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="gallery"
    )  # cover | gallery | 360
    caption: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="gallery_items")


class VenuePricing(Base):
    __tablename__ = "venue_pricing"
    __table_args__ = (
        UniqueConstraint("venue_id", name="uq_venue_pricing_venue_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pricing_mode: Mapped[str] = mapped_column(
        String(30), nullable=False, default=PricingMode.FULL_DAY.value
    )
    pricing_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default=PricingType.VENUE_ONLY.value
    )
    gst_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("18.00")
    )
    gst_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="excluded")
    advance_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("25.00")
    )
    booking_window_days: Mapped[int] = mapped_column(Integer, nullable=False, default=180)
    minimum_notice_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=24)
    operating_hours: Mapped[str | None] = mapped_column(String(100), nullable=True)
    booking_confirmation: Mapped[str] = mapped_column(
        String(30), nullable=False, default="manual"
    )
    cancellation_preset: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="pricing")
    slots: Mapped[list["VenueSlot"]] = relationship(
        "VenueSlot",
        back_populates="pricing",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="VenueSlot.display_order",
    )
    food_slots: Mapped[list["VenueFoodSlot"]] = relationship(
        "VenueFoodSlot",
        back_populates="pricing",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="VenueFoodSlot.display_order",
    )


class VenueSlot(Base):
    __tablename__ = "venue_slots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_pricing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_pricing.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot_key: Mapped[str] = mapped_column(String(50), nullable=False, default="custom")
    slot_name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    time_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    slot_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    min_booking_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    max_guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    pricing: Mapped["VenuePricing"] = relationship("VenuePricing", back_populates="slots")


class VenueFoodSlot(Base):
    __tablename__ = "venue_food_slots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    venue_pricing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_pricing.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    meal_key: Mapped[str] = mapped_column(String(50), nullable=False, default="custom")
    meal_name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    time_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    veg_plate_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    non_veg_plate_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    minimum_guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    maximum_guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    pricing: Mapped["VenuePricing"] = relationship(
        "VenuePricing", back_populates="food_slots"
    )
