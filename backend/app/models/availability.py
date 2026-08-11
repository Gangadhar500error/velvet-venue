import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    PARTIALLY_BOOKED = "partially_booked"
    BLOCKED = "blocked"
    HOLIDAY = "holiday"
    CLOSED = "closed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_BOOKING = "no_booking"
    EXPIRED = "expired"


class BlockReason(str, enum.Enum):
    MAINTENANCE = "maintenance"
    PRIVATE_EVENT = "private_event"
    HOLIDAY = "holiday"
    PERSONAL_USE = "personal_use"
    RENOVATION = "renovation"
    EMERGENCY = "emergency"


class RecurrenceType(str, enum.Enum):
    NONE = "none"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class VenueAvailability(Base):
    __tablename__ = "venue_availability"
    __table_args__ = (
        UniqueConstraint("venue_id", "availability_date", name="uq_venue_availability_date"),
        Index("ix_venue_availability_venue_date", "venue_id", "availability_date"),
        Index("ix_venue_availability_status", "status"),
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
    availability_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=AvailabilityStatus.AVAILABLE.value, index=True
    )
    available_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    booked_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    generated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_manual_override: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    venue: Mapped["Venue"] = relationship("Venue", foreign_keys=[venue_id])  # noqa: F821
    slots: Mapped[list["VenueSlotAvailability"]] = relationship(
        "VenueSlotAvailability",
        back_populates="availability",
        lazy="selectin",
        cascade="save-update, merge",
    )


class VenueSlotAvailability(Base):
    __tablename__ = "venue_slot_availability"
    __table_args__ = (
        Index("ix_venue_slot_avail_availability_id", "availability_id"),
        Index("ix_venue_slot_avail_slot_id", "slot_id"),
        Index("ix_venue_slot_avail_food_slot_id", "food_slot_id"),
        Index("ix_venue_slot_avail_booking_id", "booking_id"),
        Index("ix_venue_slot_avail_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    availability_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_availability.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_slots.id", ondelete="SET NULL"),
        nullable=True,
    )
    food_slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_food_slots.id", ondelete="SET NULL"),
        nullable=True,
    )
    slot_kind: Mapped[str] = mapped_column(String(20), nullable=False, default="venue")
    slot_key: Mapped[str] = mapped_column(String(50), nullable=False, default="full_day")
    slot_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Full Day")
    time_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=AvailabilityStatus.AVAILABLE.value
    )
    booking_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    booking_ref: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    event_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blocked_reason: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    availability: Mapped["VenueAvailability"] = relationship(
        "VenueAvailability", back_populates="slots"
    )


class VenueAvailabilityBlock(Base):
    __tablename__ = "venue_availability_blocks"
    __table_args__ = (
        Index("ix_venue_avail_blocks_venue_dates", "venue_id", "start_date", "end_date"),
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
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("venue_slots.id", ondelete="SET NULL"), nullable=True
    )
    food_slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_food_slots.id", ondelete="SET NULL"),
        nullable=True,
    )
    reason: Mapped[str] = mapped_column(
        String(50), nullable=False, default=BlockReason.MAINTENANCE.value
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recurrence_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=RecurrenceType.NONE.value
    )
    recurrence_interval: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    weekdays: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    nth_weekday: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recurrence_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
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
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    venue: Mapped["Venue"] = relationship("Venue", foreign_keys=[venue_id])  # noqa: F821


class VenueAvailabilityLog(Base):
    __tablename__ = "venue_availability_logs"
    __table_args__ = (Index("ix_venue_avail_logs_availability_id", "availability_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    availability_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_availability.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot_availability_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_slot_availability.id", ondelete="SET NULL"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    performed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
