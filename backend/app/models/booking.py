import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BookingType(str, enum.Enum):
    VENUE_ONLY = "venue_only"
    VENUE_FOOD = "venue_food"


class BookingMode(str, enum.Enum):
    FULL_DAY = "full_day"
    SLOT_BASED = "slot_based"


class BookingStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    REFUNDED = "refunded"
    REJECTED = "rejected"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class InvoiceType(str, enum.Enum):
    BOOKING = "booking"
    ADVANCE = "advance"
    INSTALLMENT = "installment"
    FINAL = "final"


class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    GENERATED = "generated"
    SENT = "sent"
    PAID = "paid"
    CANCELLED = "cancelled"


class PaymentType(str, enum.Enum):
    ADVANCE = "advance"
    INSTALLMENT = "installment"
    FINAL = "final"
    REFUND = "refund"


class PaymentRecordStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


ACTIVE_BOOKING_STATUSES = (
    BookingStatus.DRAFT.value,
    BookingStatus.PENDING.value,
    BookingStatus.CONFIRMED.value,
    BookingStatus.CHECKED_IN.value,
)

INACTIVE_BOOKING_STATUSES = (
    BookingStatus.CANCELLED.value,
    BookingStatus.REJECTED.value,
    BookingStatus.REFUNDED.value,
)


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("booking_number", name="uq_bookings_booking_number"),
        Index("ix_bookings_venue_start", "venue_id", "start_date"),
        Index("ix_bookings_customer_created", "customer_id", "created_at"),
        Index("ix_bookings_vendor_status", "vendor_id", "booking_status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    booking_number: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_owners.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    availability_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_availability.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    pricing_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_pricing.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    booking_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default=BookingType.VENUE_ONLY.value, index=True
    )
    booking_mode: Mapped[str] = mapped_column(
        String(30), nullable=False, default=BookingMode.FULL_DAY.value, index=True
    )
    event_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    booking_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=BookingStatus.PENDING.value, index=True
    )
    payment_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=PaymentStatus.PENDING.value, index=True
    )
    approval_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=ApprovalStatus.PENDING.value, index=True
    )
    booking_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    special_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    selected_slot_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    selected_food_slots: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    selected_services: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    gst_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    advance_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=0
    )
    advance_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    remaining_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    platform_commission: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )
    vendor_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="INR")
    gst_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    gst_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="excluded")
    assigned_executive: Mapped[str | None] = mapped_column(String(150), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
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

    customer: Mapped["Customer"] = relationship("Customer", foreign_keys=[customer_id], lazy="selectin")  # noqa: F821
    vendor: Mapped["VenueOwner"] = relationship("VenueOwner", foreign_keys=[vendor_id], lazy="selectin")  # noqa: F821
    business_profile: Mapped["BusinessProfile"] = relationship(  # noqa: F821
        "BusinessProfile", foreign_keys=[business_profile_id], lazy="selectin"
    )
    venue: Mapped["Venue"] = relationship("Venue", foreign_keys=[venue_id], lazy="selectin")  # noqa: F821
    days: Mapped[list["BookingDay"]] = relationship(
        "BookingDay",
        back_populates="booking",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="BookingDay.event_date",
    )
    slots: Mapped[list["BookingSlot"]] = relationship(
        "BookingSlot",
        back_populates="booking",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    food_items: Mapped[list["BookingFood"]] = relationship(
        "BookingFood",
        back_populates="booking",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    services: Mapped[list["BookingService"]] = relationship(
        "BookingService",
        back_populates="booking",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="booking",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Payment.created_at",
    )
    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice",
        back_populates="booking",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Invoice.created_at",
    )
    activities: Mapped[list["BookingActivity"]] = relationship(
        "BookingActivity",
        back_populates="booking",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="BookingActivity.created_at",
    )


class BookingDay(Base):
    __tablename__ = "booking_days"
    __table_args__ = (
        UniqueConstraint("booking_id", "date", name="uq_booking_days_date"),
        Index("ix_booking_days_date", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_date: Mapped[date] = mapped_column("date", Date, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="booked")

    booking: Mapped["Booking"] = relationship("Booking", back_populates="days")


class BookingSlot(Base):
    __tablename__ = "booking_slots"
    __table_args__ = (
        UniqueConstraint(
            "booking_id", "venue_slot_id", "event_date", name="uq_booking_slots_day"
        ),
        Index("ix_booking_slots_slot_id", "venue_slot_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    venue_slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_slots.id", ondelete="SET NULL"),
        nullable=True,
    )
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    slot_key: Mapped[str | None] = mapped_column(String(50), nullable=True)
    slot_name: Mapped[str] = mapped_column(String(100), nullable=False)
    slot_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    start_time: Mapped[str | None] = mapped_column(String(20), nullable=True)
    end_time: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="booked")

    booking: Mapped["Booking"] = relationship("Booking", back_populates="slots")


class BookingFood(Base):
    __tablename__ = "booking_food"
    __table_args__ = (
        UniqueConstraint(
            "booking_id", "food_slot_id", "event_date", name="uq_booking_food_day"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    food_slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_food_slots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    meal_key: Mapped[str | None] = mapped_column(String(50), nullable=True)
    meal_name: Mapped[str] = mapped_column(String(100), nullable=False)
    veg_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    nonveg_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    veg_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nonveg_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="booked")

    booking: Mapped["Booking"] = relationship("Booking", back_populates="food_items")


class BookingService(Base):
    __tablename__ = "booking_services"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_name: Mapped[str] = mapped_column(String(150), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="services")


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_booking_status", "booking_id", "status"),
        UniqueConstraint("payment_reference", name="uq_payments_reference"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("invoices.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    invoice_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    payment_reference: Mapped[str] = mapped_column(String(50), nullable=False)
    transaction_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gateway: Mapped[str | None] = mapped_column(String(50), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    payment_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default=PaymentType.ADVANCE.value
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=PaymentRecordStatus.PENDING.value, index=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    collected_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="payments")
    invoice: Mapped["Invoice | None"] = relationship(
        "Invoice", foreign_keys=[invoice_id], lazy="selectin"
    )


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (UniqueConstraint("invoice_number", name="uq_invoices_number"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    invoice_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default=InvoiceType.BOOKING.value
    )
    invoice_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=InvoiceStatus.GENERATED.value, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    gst_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    issued_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="invoices")


class BookingActivity(Base):
    __tablename__ = "booking_activity"
    __table_args__ = (Index("ix_booking_activity_booking_created", "booking_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="activities")
