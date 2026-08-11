"""Create bookings, payments, invoices, and activity tables.

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d0e1f2a3b4c5"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bookings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=True),
        sa.Column("booking_number", sa.String(length=30), nullable=False),
        sa.Column("customer_id", sa.UUID(), nullable=False),
        sa.Column("vendor_id", sa.UUID(), nullable=False),
        sa.Column("business_profile_id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("availability_id", sa.UUID(), nullable=True),
        sa.Column("pricing_id", sa.UUID(), nullable=True),
        sa.Column("booking_type", sa.String(length=30), server_default="venue_only", nullable=False),
        sa.Column("booking_mode", sa.String(length=30), server_default="full_day", nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=True),
        sa.Column("booking_status", sa.String(length=30), server_default="pending", nullable=False),
        sa.Column("payment_status", sa.String(length=30), server_default="pending", nullable=False),
        sa.Column("approval_status", sa.String(length=30), server_default="pending", nullable=False),
        sa.Column("booking_date", sa.Date(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("guest_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("special_note", sa.Text(), nullable=True),
        sa.Column(
            "selected_slot_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "selected_food_slots",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "selected_services",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("subtotal", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("gst_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("discount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("advance_percentage", sa.Numeric(5, 2), server_default="0", nullable=False),
        sa.Column("advance_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("remaining_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("platform_commission", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("vendor_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("paid_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("currency", sa.String(length=10), server_default="INR", nullable=False),
        sa.Column("gst_percent", sa.Numeric(5, 2), server_default="0", nullable=False),
        sa.Column("gst_mode", sa.String(length=20), server_default="excluded", nullable=False),
        sa.Column("assigned_executive", sa.String(length=150), nullable=True),
        sa.Column("payment_method", sa.String(length=50), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["vendor_id"], ["venue_owners.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["business_profile_id"], ["business_profiles.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["availability_id"], ["venue_availability.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["pricing_id"], ["venue_pricing.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_number", name="uq_bookings_booking_number"),
    )
    op.create_index("ix_bookings_tenant_id", "bookings", ["tenant_id"])
    op.create_index("ix_bookings_booking_number", "bookings", ["booking_number"])
    op.create_index("ix_bookings_customer_id", "bookings", ["customer_id"])
    op.create_index("ix_bookings_vendor_id", "bookings", ["vendor_id"])
    op.create_index("ix_bookings_business_profile_id", "bookings", ["business_profile_id"])
    op.create_index("ix_bookings_venue_id", "bookings", ["venue_id"])
    op.create_index("ix_bookings_availability_id", "bookings", ["availability_id"])
    op.create_index("ix_bookings_pricing_id", "bookings", ["pricing_id"])
    op.create_index("ix_bookings_booking_type", "bookings", ["booking_type"])
    op.create_index("ix_bookings_booking_mode", "bookings", ["booking_mode"])
    op.create_index("ix_bookings_booking_status", "bookings", ["booking_status"])
    op.create_index("ix_bookings_payment_status", "bookings", ["payment_status"])
    op.create_index("ix_bookings_approval_status", "bookings", ["approval_status"])
    op.create_index("ix_bookings_booking_date", "bookings", ["booking_date"])
    op.create_index("ix_bookings_start_date", "bookings", ["start_date"])
    op.create_index("ix_bookings_end_date", "bookings", ["end_date"])
    op.create_index("ix_bookings_created_at", "bookings", ["created_at"])
    op.create_index("ix_bookings_deleted_at", "bookings", ["deleted_at"])
    op.create_index("ix_bookings_venue_start", "bookings", ["venue_id", "start_date"])
    op.create_index("ix_bookings_customer_created", "bookings", ["customer_id", "created_at"])
    op.create_index("ix_bookings_vendor_status", "bookings", ["vendor_id", "booking_status"])

    op.create_table(
        "booking_days",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="booked", nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_id", "date", name="uq_booking_days_date"),
    )
    op.create_index("ix_booking_days_booking_id", "booking_days", ["booking_id"])
    op.create_index("ix_booking_days_date", "booking_days", ["date"])

    op.create_table(
        "booking_slots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=False),
        sa.Column("venue_slot_id", sa.UUID(), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=True),
        sa.Column("slot_key", sa.String(length=50), nullable=True),
        sa.Column("slot_name", sa.String(length=100), nullable=False),
        sa.Column("slot_price", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("start_time", sa.String(length=20), nullable=True),
        sa.Column("end_time", sa.String(length=20), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="booked", nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["venue_slot_id"], ["venue_slots.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "booking_id", "venue_slot_id", "event_date", name="uq_booking_slots_day"
        ),
    )
    op.create_index("ix_booking_slots_booking_id", "booking_slots", ["booking_id"])
    op.create_index("ix_booking_slots_slot_id", "booking_slots", ["venue_slot_id"])

    op.create_table(
        "booking_food",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=False),
        sa.Column("food_slot_id", sa.UUID(), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=True),
        sa.Column("meal_key", sa.String(length=50), nullable=True),
        sa.Column("meal_name", sa.String(length=100), nullable=False),
        sa.Column("veg_price", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("nonveg_price", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("veg_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("nonveg_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=30), server_default="booked", nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["food_slot_id"], ["venue_food_slots.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "booking_id", "food_slot_id", "event_date", name="uq_booking_food_day"
        ),
    )
    op.create_index("ix_booking_food_booking_id", "booking_food", ["booking_id"])
    op.create_index("ix_booking_food_food_slot_id", "booking_food", ["food_slot_id"])

    op.create_table(
        "booking_services",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=False),
        sa.Column("service_name", sa.String(length=150), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("quantity", sa.Integer(), server_default="1", nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_booking_services_booking_id", "booking_services", ["booking_id"])

    op.create_table(
        "invoices",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=False),
        sa.Column("invoice_number", sa.String(length=50), nullable=False),
        sa.Column("invoice_type", sa.String(length=30), server_default="booking", nullable=False),
        sa.Column(
            "invoice_status", sa.String(length=30), server_default="generated", nullable=False
        ),
        sa.Column("amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("gst_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("pdf_url", sa.String(length=500), nullable=True),
        sa.Column(
            "issued_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invoice_number", name="uq_invoices_number"),
    )
    op.create_index("ix_invoices_booking_id", "invoices", ["booking_id"])
    op.create_index("ix_invoices_invoice_number", "invoices", ["invoice_number"])
    op.create_index("ix_invoices_invoice_status", "invoices", ["invoice_status"])

    op.create_table(
        "payments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=False),
        sa.Column("invoice_id", sa.UUID(), nullable=True),
        sa.Column("invoice_number", sa.String(length=50), nullable=True),
        sa.Column("payment_reference", sa.String(length=50), nullable=False),
        sa.Column("transaction_id", sa.String(length=100), nullable=True),
        sa.Column("gateway", sa.String(length=50), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("payment_type", sa.String(length=30), server_default="advance", nullable=False),
        sa.Column("status", sa.String(length=30), server_default="pending", nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("collected_by", sa.String(length=150), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("payment_reference", name="uq_payments_reference"),
    )
    op.create_index("ix_payments_booking_id", "payments", ["booking_id"])
    op.create_index("ix_payments_invoice_id", "payments", ["invoice_id"])
    op.create_index("ix_payments_status", "payments", ["status"])
    op.create_index("ix_payments_created_at", "payments", ["created_at"])
    op.create_index("ix_payments_booking_status", "payments", ["booking_id", "status"])

    op.create_table(
        "booking_activity",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_booking_activity_booking_id", "booking_activity", ["booking_id"])
    op.create_index("ix_booking_activity_created_at", "booking_activity", ["created_at"])
    op.create_index(
        "ix_booking_activity_booking_created", "booking_activity", ["booking_id", "created_at"]
    )

    op.execute("UPDATE venue_slot_availability SET booking_id = NULL WHERE booking_id IS NOT NULL")
    op.execute("UPDATE venue_reviews SET booking_id = NULL WHERE booking_id IS NOT NULL")
    op.create_foreign_key(
        "fk_venue_slot_avail_booking_id",
        "venue_slot_availability",
        "bookings",
        ["booking_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_venue_reviews_booking_id",
        "venue_reviews",
        "bookings",
        ["booking_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_venue_reviews_booking_id", "venue_reviews", type_="foreignkey")
    op.drop_constraint(
        "fk_venue_slot_avail_booking_id", "venue_slot_availability", type_="foreignkey"
    )
    op.drop_index("ix_booking_activity_booking_created", table_name="booking_activity")
    op.drop_index("ix_booking_activity_created_at", table_name="booking_activity")
    op.drop_index("ix_booking_activity_booking_id", table_name="booking_activity")
    op.drop_table("booking_activity")
    op.drop_index("ix_payments_booking_status", table_name="payments")
    op.drop_index("ix_payments_created_at", table_name="payments")
    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_invoice_id", table_name="payments")
    op.drop_index("ix_payments_booking_id", table_name="payments")
    op.drop_table("payments")
    op.drop_index("ix_invoices_invoice_status", table_name="invoices")
    op.drop_index("ix_invoices_invoice_number", table_name="invoices")
    op.drop_index("ix_invoices_booking_id", table_name="invoices")
    op.drop_table("invoices")
    op.drop_index("ix_booking_services_booking_id", table_name="booking_services")
    op.drop_table("booking_services")
    op.drop_index("ix_booking_food_food_slot_id", table_name="booking_food")
    op.drop_index("ix_booking_food_booking_id", table_name="booking_food")
    op.drop_table("booking_food")
    op.drop_index("ix_booking_slots_slot_id", table_name="booking_slots")
    op.drop_index("ix_booking_slots_booking_id", table_name="booking_slots")
    op.drop_table("booking_slots")
    op.drop_index("ix_booking_days_date", table_name="booking_days")
    op.drop_index("ix_booking_days_booking_id", table_name="booking_days")
    op.drop_table("booking_days")
    op.drop_index("ix_bookings_vendor_status", table_name="bookings")
    op.drop_index("ix_bookings_customer_created", table_name="bookings")
    op.drop_index("ix_bookings_venue_start", table_name="bookings")
    op.drop_index("ix_bookings_deleted_at", table_name="bookings")
    op.drop_index("ix_bookings_created_at", table_name="bookings")
    op.drop_index("ix_bookings_end_date", table_name="bookings")
    op.drop_index("ix_bookings_start_date", table_name="bookings")
    op.drop_index("ix_bookings_booking_date", table_name="bookings")
    op.drop_index("ix_bookings_approval_status", table_name="bookings")
    op.drop_index("ix_bookings_payment_status", table_name="bookings")
    op.drop_index("ix_bookings_booking_status", table_name="bookings")
    op.drop_index("ix_bookings_booking_mode", table_name="bookings")
    op.drop_index("ix_bookings_booking_type", table_name="bookings")
    op.drop_index("ix_bookings_pricing_id", table_name="bookings")
    op.drop_index("ix_bookings_availability_id", table_name="bookings")
    op.drop_index("ix_bookings_venue_id", table_name="bookings")
    op.drop_index("ix_bookings_business_profile_id", table_name="bookings")
    op.drop_index("ix_bookings_vendor_id", table_name="bookings")
    op.drop_index("ix_bookings_customer_id", table_name="bookings")
    op.drop_index("ix_bookings_booking_number", table_name="bookings")
    op.drop_index("ix_bookings_tenant_id", table_name="bookings")
    op.drop_table("bookings")
