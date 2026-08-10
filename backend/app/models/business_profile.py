import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BusinessProfileStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    DELETED = "deleted"


class BusinessProfileVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class BusinessDocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    __table_args__ = (
        Index("ix_business_profiles_tenant_created", "tenant_id", "created_at"),
        UniqueConstraint("business_code", name="uq_business_profiles_business_code"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    venue_owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("venue_owners.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    business_code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)

    business_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    legal_business_name: Mapped[str] = mapped_column(String(200), nullable=False)
    business_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    years_in_business: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)

    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    alternate_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    gst_number: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    pan_number: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    business_registration_number: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )

    account_holder_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ifsc_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cancelled_cheque_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bank_proof_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_proof_file_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_proof_uploaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    verification_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=BusinessProfileVerificationStatus.PENDING.value,
        index=True,
    )
    verification_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=BusinessProfileStatus.PENDING.value,
        index=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejected_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

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

    venue_owner: Mapped["VenueOwner"] = relationship(  # noqa: F821
        "VenueOwner", foreign_keys=[venue_owner_id], lazy="selectin"
    )
    documents: Mapped[list["BusinessProfileDocument"]] = relationship(
        "BusinessProfileDocument",
        back_populates="business_profile",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class BusinessProfileDocument(Base):
    __tablename__ = "business_profile_documents"
    __table_args__ = (
        Index("ix_bp_documents_profile_slot", "business_profile_id", "document_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    business_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=BusinessDocumentStatus.PENDING.value,
    )
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

    business_profile: Mapped["BusinessProfile"] = relationship(
        "BusinessProfile", back_populates="documents"
    )
