"""create venues module tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-10 18:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "venues",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=True),
        sa.Column("business_profile_id", sa.UUID(), nullable=False),
        sa.Column("venue_code", sa.String(length=30), nullable=False),
        sa.Column("venue_name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("venue_type", sa.String(length=100), nullable=True),
        sa.Column("short_description", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("house_rules", sa.Text(), nullable=True),
        sa.Column("highlights", sa.Text(), nullable=True),
        sa.Column(
            "featured",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("address_line1", sa.String(length=255), nullable=True),
        sa.Column("address_line2", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("latitude", sa.String(length=50), nullable=True),
        sa.Column("longitude", sa.String(length=50), nullable=True),
        sa.Column("google_map_url", sa.String(length=500), nullable=True),
        sa.Column("landmark", sa.String(length=255), nullable=True),
        sa.Column("minimum_guests", sa.Integer(), nullable=True),
        sa.Column("maximum_guests", sa.Integer(), nullable=True),
        sa.Column("seating_capacity", sa.Integer(), nullable=True),
        sa.Column("dining_capacity", sa.Integer(), nullable=True),
        sa.Column("floating_capacity", sa.Integer(), nullable=True),
        sa.Column(
            "venue_status",
            sa.String(length=20),
            server_default="draft",
            nullable=False,
        ),
        sa.Column(
            "approval_status",
            sa.String(length=20),
            server_default="pending",
            nullable=False,
        ),
        sa.Column(
            "availability_status",
            sa.String(length=20),
            server_default="available",
            nullable=False,
        ),
        sa.Column("operating_hours", sa.String(length=100), nullable=True),
        sa.Column("weekly_off", sa.String(length=50), nullable=True),
        sa.Column("check_in_time", sa.String(length=20), nullable=True),
        sa.Column("check_out_time", sa.String(length=20), nullable=True),
        sa.Column("contact_person", sa.String(length=150), nullable=True),
        sa.Column("contact_phone", sa.String(length=20), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("support_email", sa.String(length=255), nullable=True),
        sa.Column("support_phone", sa.String(length=20), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("smoking_policy", sa.String(length=100), nullable=True),
        sa.Column("alcohol_policy", sa.String(length=100), nullable=True),
        sa.Column(
            "outside_catering",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "outside_decorations",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "outside_photography",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "pets_allowed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("cancellation_policy", sa.Text(), nullable=True),
        sa.Column("refund_policy", sa.Text(), nullable=True),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column("video_url", sa.String(length=500), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column("approved_by", sa.UUID(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_reason", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["business_profile_id"],
            ["business_profiles.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("venue_code", name="uq_venues_venue_code"),
    )
    op.create_index("ix_venues_tenant_id", "venues", ["tenant_id"])
    op.create_index("ix_venues_business_profile_id", "venues", ["business_profile_id"])
    op.create_index("ix_venues_venue_code", "venues", ["venue_code"])
    op.create_index("ix_venues_venue_name", "venues", ["venue_name"])
    op.create_index("ix_venues_category", "venues", ["category"])
    op.create_index("ix_venues_venue_type", "venues", ["venue_type"])
    op.create_index("ix_venues_city", "venues", ["city"])
    op.create_index("ix_venues_venue_status", "venues", ["venue_status"])
    op.create_index("ix_venues_approval_status", "venues", ["approval_status"])
    op.create_index(
        "ix_venues_availability_status", "venues", ["availability_status"]
    )
    op.create_index("ix_venues_created_at", "venues", ["created_at"])
    op.create_index("ix_venues_deleted_at", "venues", ["deleted_at"])
    op.create_index(
        "ix_venues_tenant_created", "venues", ["tenant_id", "created_at"]
    )

    op.create_table(
        "venue_amenities",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "display_order",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_venue_amenities_code"),
    )
    op.create_index("ix_venue_amenities_code", "venue_amenities", ["code"])

    op.create_table(
        "venue_amenity_mapping",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("amenity_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["amenity_id"], ["venue_amenities.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("venue_id", "amenity_id", name="uq_venue_amenity"),
    )
    op.create_index(
        "ix_venue_amenity_mapping_venue_id", "venue_amenity_mapping", ["venue_id"]
    )
    op.create_index(
        "ix_venue_amenity_mapping_amenity_id",
        "venue_amenity_mapping",
        ["amenity_id"],
    )

    op.create_table(
        "venue_services",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "display_order",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_venue_services_code"),
    )
    op.create_index("ix_venue_services_code", "venue_services", ["code"])

    op.create_table(
        "venue_service_mapping",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("service_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["service_id"], ["venue_services.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("venue_id", "service_id", name="uq_venue_service"),
    )
    op.create_index(
        "ix_venue_service_mapping_venue_id", "venue_service_mapping", ["venue_id"]
    )
    op.create_index(
        "ix_venue_service_mapping_service_id",
        "venue_service_mapping",
        ["service_id"],
    )

    op.create_table(
        "event_types",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "display_order",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_event_types_code"),
    )
    op.create_index("ix_event_types_code", "event_types", ["code"])

    op.create_table(
        "venue_event_mapping",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("event_type_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["event_type_id"], ["event_types.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("venue_id", "event_type_id", name="uq_venue_event"),
    )
    op.create_index(
        "ix_venue_event_mapping_venue_id", "venue_event_mapping", ["venue_id"]
    )
    op.create_index(
        "ix_venue_event_mapping_event_type_id",
        "venue_event_mapping",
        ["event_type_id"],
    )

    op.create_table(
        "venue_documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("document_type", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("file_size", sa.String(length=50), nullable=True),
        sa.Column("file_url", sa.String(length=500), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("verified_by", sa.String(length=200), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_venue_documents_venue_id", "venue_documents", ["venue_id"])

    op.create_table(
        "venue_gallery",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column(
            "image_type",
            sa.String(length=50),
            server_default="gallery",
            nullable=False,
        ),
        sa.Column("caption", sa.String(length=255), nullable=True),
        sa.Column(
            "display_order",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_venue_gallery_venue_id", "venue_gallery", ["venue_id"])

    op.create_table(
        "venue_pricing",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column(
            "pricing_mode",
            sa.String(length=30),
            server_default="full_day",
            nullable=False,
        ),
        sa.Column(
            "pricing_type",
            sa.String(length=30),
            server_default="venue_only",
            nullable=False,
        ),
        sa.Column(
            "gst_percent",
            sa.Numeric(5, 2),
            server_default="18.00",
            nullable=False,
        ),
        sa.Column(
            "gst_mode",
            sa.String(length=20),
            server_default="excluded",
            nullable=False,
        ),
        sa.Column(
            "advance_percent",
            sa.Numeric(5, 2),
            server_default="25.00",
            nullable=False,
        ),
        sa.Column(
            "booking_window_days",
            sa.Integer(),
            server_default="180",
            nullable=False,
        ),
        sa.Column(
            "minimum_notice_hours",
            sa.Integer(),
            server_default="24",
            nullable=False,
        ),
        sa.Column("operating_hours", sa.String(length=100), nullable=True),
        sa.Column(
            "booking_confirmation",
            sa.String(length=30),
            server_default="manual",
            nullable=False,
        ),
        sa.Column("cancellation_preset", sa.String(length=50), nullable=True),
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
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("venue_id", name="uq_venue_pricing_venue_id"),
    )
    op.create_index("ix_venue_pricing_venue_id", "venue_pricing", ["venue_id"])

    op.create_table(
        "venue_slots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_pricing_id", sa.UUID(), nullable=False),
        sa.Column(
            "slot_key",
            sa.String(length=50),
            server_default="custom",
            nullable=False,
        ),
        sa.Column("slot_name", sa.String(length=100), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("time_label", sa.String(length=50), nullable=True),
        sa.Column(
            "slot_price",
            sa.Numeric(12, 2),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "min_booking_amount",
            sa.Numeric(12, 2),
            server_default="0",
            nullable=False,
        ),
        sa.Column("max_guests", sa.Integer(), nullable=True),
        sa.Column(
            "enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "display_order",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["venue_pricing_id"], ["venue_pricing.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_venue_slots_venue_pricing_id", "venue_slots", ["venue_pricing_id"]
    )

    op.create_table(
        "venue_food_slots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_pricing_id", sa.UUID(), nullable=False),
        sa.Column(
            "meal_key",
            sa.String(length=50),
            server_default="custom",
            nullable=False,
        ),
        sa.Column("meal_name", sa.String(length=100), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("time_label", sa.String(length=50), nullable=True),
        sa.Column(
            "veg_plate_price",
            sa.Numeric(12, 2),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "non_veg_plate_price",
            sa.Numeric(12, 2),
            server_default="0",
            nullable=False,
        ),
        sa.Column("minimum_guests", sa.Integer(), nullable=True),
        sa.Column("maximum_guests", sa.Integer(), nullable=True),
        sa.Column(
            "enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "display_order",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["venue_pricing_id"], ["venue_pricing.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_venue_food_slots_venue_pricing_id",
        "venue_food_slots",
        ["venue_pricing_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_venue_food_slots_venue_pricing_id", table_name="venue_food_slots"
    )
    op.drop_table("venue_food_slots")

    op.drop_index("ix_venue_slots_venue_pricing_id", table_name="venue_slots")
    op.drop_table("venue_slots")

    op.drop_index("ix_venue_pricing_venue_id", table_name="venue_pricing")
    op.drop_table("venue_pricing")

    op.drop_index("ix_venue_gallery_venue_id", table_name="venue_gallery")
    op.drop_table("venue_gallery")

    op.drop_index("ix_venue_documents_venue_id", table_name="venue_documents")
    op.drop_table("venue_documents")

    op.drop_index(
        "ix_venue_event_mapping_event_type_id", table_name="venue_event_mapping"
    )
    op.drop_index("ix_venue_event_mapping_venue_id", table_name="venue_event_mapping")
    op.drop_table("venue_event_mapping")

    op.drop_index("ix_event_types_code", table_name="event_types")
    op.drop_table("event_types")

    op.drop_index(
        "ix_venue_service_mapping_service_id", table_name="venue_service_mapping"
    )
    op.drop_index(
        "ix_venue_service_mapping_venue_id", table_name="venue_service_mapping"
    )
    op.drop_table("venue_service_mapping")

    op.drop_index("ix_venue_services_code", table_name="venue_services")
    op.drop_table("venue_services")

    op.drop_index(
        "ix_venue_amenity_mapping_amenity_id", table_name="venue_amenity_mapping"
    )
    op.drop_index(
        "ix_venue_amenity_mapping_venue_id", table_name="venue_amenity_mapping"
    )
    op.drop_table("venue_amenity_mapping")

    op.drop_index("ix_venue_amenities_code", table_name="venue_amenities")
    op.drop_table("venue_amenities")

    op.drop_index("ix_venues_tenant_created", table_name="venues")
    op.drop_index("ix_venues_deleted_at", table_name="venues")
    op.drop_index("ix_venues_created_at", table_name="venues")
    op.drop_index("ix_venues_availability_status", table_name="venues")
    op.drop_index("ix_venues_approval_status", table_name="venues")
    op.drop_index("ix_venues_venue_status", table_name="venues")
    op.drop_index("ix_venues_city", table_name="venues")
    op.drop_index("ix_venues_venue_type", table_name="venues")
    op.drop_index("ix_venues_category", table_name="venues")
    op.drop_index("ix_venues_venue_name", table_name="venues")
    op.drop_index("ix_venues_venue_code", table_name="venues")
    op.drop_index("ix_venues_business_profile_id", table_name="venues")
    op.drop_index("ix_venues_tenant_id", table_name="venues")
    op.drop_table("venues")
