"""Create venue availability calendar tables.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "venue_availability",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("availability_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="available", nullable=False),
        sa.Column("available_capacity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("booked_capacity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("generated", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "is_manual_override",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
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
        sa.UniqueConstraint("venue_id", "availability_date", name="uq_venue_availability_date"),
    )
    op.create_index(
        "ix_venue_availability_venue_id", "venue_availability", ["venue_id"]
    )
    op.create_index(
        "ix_venue_availability_venue_date",
        "venue_availability",
        ["venue_id", "availability_date"],
    )
    op.create_index("ix_venue_availability_date", "venue_availability", ["availability_date"])
    op.create_index("ix_venue_availability_status", "venue_availability", ["status"])

    op.create_table(
        "venue_slot_availability",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("availability_id", sa.UUID(), nullable=False),
        sa.Column("slot_id", sa.UUID(), nullable=True),
        sa.Column("food_slot_id", sa.UUID(), nullable=True),
        sa.Column("slot_kind", sa.String(length=20), server_default="venue", nullable=False),
        sa.Column("slot_key", sa.String(length=50), server_default="full_day", nullable=False),
        sa.Column("slot_name", sa.String(length=100), server_default="Full Day", nullable=False),
        sa.Column("time_label", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="available", nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=True),
        sa.Column("booking_ref", sa.String(length=50), nullable=True),
        sa.Column("customer_name", sa.String(length=150), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=True),
        sa.Column("guests", sa.Integer(), nullable=True),
        sa.Column("blocked_reason", sa.String(length=50), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["availability_id"], ["venue_availability.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["slot_id"], ["venue_slots.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["food_slot_id"], ["venue_food_slots.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_venue_slot_avail_availability_id",
        "venue_slot_availability",
        ["availability_id"],
    )
    op.create_index("ix_venue_slot_avail_slot_id", "venue_slot_availability", ["slot_id"])
    op.create_index(
        "ix_venue_slot_avail_food_slot_id", "venue_slot_availability", ["food_slot_id"]
    )
    op.create_index(
        "ix_venue_slot_avail_booking_id", "venue_slot_availability", ["booking_id"]
    )
    op.create_index("ix_venue_slot_avail_status", "venue_slot_availability", ["status"])
    op.create_index(
        "uq_venue_slot_avail_slot",
        "venue_slot_availability",
        ["availability_id", "slot_id"],
        unique=True,
        postgresql_where=sa.text("slot_id IS NOT NULL"),
    )
    op.create_index(
        "uq_venue_slot_avail_food",
        "venue_slot_availability",
        ["availability_id", "food_slot_id"],
        unique=True,
        postgresql_where=sa.text("food_slot_id IS NOT NULL"),
    )

    op.create_table(
        "venue_availability_blocks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("slot_id", sa.UUID(), nullable=True),
        sa.Column("food_slot_id", sa.UUID(), nullable=True),
        sa.Column("reason", sa.String(length=50), server_default="maintenance", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("recurrence_type", sa.String(length=20), server_default="none", nullable=False),
        sa.Column("recurrence_interval", sa.Integer(), server_default="1", nullable=False),
        sa.Column(
            "weekdays",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("nth_weekday", sa.Integer(), nullable=True),
        sa.Column("recurrence_end_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
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
        sa.ForeignKeyConstraint(["slot_id"], ["venue_slots.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["food_slot_id"], ["venue_food_slots.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_venue_avail_blocks_venue_id", "venue_availability_blocks", ["venue_id"]
    )
    op.create_index(
        "ix_venue_avail_blocks_venue_dates",
        "venue_availability_blocks",
        ["venue_id", "start_date", "end_date"],
    )

    op.create_table(
        "venue_availability_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("availability_id", sa.UUID(), nullable=False),
        sa.Column("slot_availability_id", sa.UUID(), nullable=True),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("old_status", sa.String(length=30), nullable=True),
        sa.Column("new_status", sa.String(length=30), nullable=True),
        sa.Column("performed_by", sa.UUID(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["availability_id"], ["venue_availability.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["slot_availability_id"],
            ["venue_slot_availability.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(["performed_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_venue_avail_logs_availability_id",
        "venue_availability_logs",
        ["availability_id"],
    )
    op.create_index(
        "ix_venue_avail_logs_created_at", "venue_availability_logs", ["created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_venue_avail_logs_created_at", table_name="venue_availability_logs")
    op.drop_index(
        "ix_venue_avail_logs_availability_id", table_name="venue_availability_logs"
    )
    op.drop_table("venue_availability_logs")

    op.drop_index(
        "ix_venue_avail_blocks_venue_dates", table_name="venue_availability_blocks"
    )
    op.drop_index("ix_venue_avail_blocks_venue_id", table_name="venue_availability_blocks")
    op.drop_table("venue_availability_blocks")

    op.drop_index("uq_venue_slot_avail_food", table_name="venue_slot_availability")
    op.drop_index("uq_venue_slot_avail_slot", table_name="venue_slot_availability")
    op.drop_index("ix_venue_slot_avail_status", table_name="venue_slot_availability")
    op.drop_index("ix_venue_slot_avail_booking_id", table_name="venue_slot_availability")
    op.drop_index("ix_venue_slot_avail_food_slot_id", table_name="venue_slot_availability")
    op.drop_index("ix_venue_slot_avail_slot_id", table_name="venue_slot_availability")
    op.drop_index(
        "ix_venue_slot_avail_availability_id", table_name="venue_slot_availability"
    )
    op.drop_table("venue_slot_availability")

    op.drop_index("ix_venue_availability_status", table_name="venue_availability")
    op.drop_index("ix_venue_availability_date", table_name="venue_availability")
    op.drop_index("ix_venue_availability_venue_date", table_name="venue_availability")
    op.drop_index("ix_venue_availability_venue_id", table_name="venue_availability")
    op.drop_table("venue_availability")
