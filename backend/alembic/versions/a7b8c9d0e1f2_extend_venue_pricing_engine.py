"""Extend venue pricing for booking engine without new tables.

Reuses venue_pricing, venue_slots, venue_food_slots.
Adds multi-config support, soft delete, operating clock times,
and an extensible JSONB extra column for future weekday/weekend/
seasonal/hourly/coupon rules.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("uq_venue_pricing_venue_id", "venue_pricing", type_="unique")

    op.add_column("venue_pricing", sa.Column("name", sa.String(length=120), nullable=True))
    op.add_column(
        "venue_pricing",
        sa.Column(
            "schedule_type",
            sa.String(length=30),
            nullable=False,
            server_default="standard",
        ),
    )
    op.add_column("venue_pricing", sa.Column("operating_start_time", sa.Time(), nullable=True))
    op.add_column("venue_pricing", sa.Column("operating_end_time", sa.Time(), nullable=True))
    op.add_column("venue_pricing", sa.Column("valid_from", sa.Date(), nullable=True))
    op.add_column("venue_pricing", sa.Column("valid_to", sa.Date(), nullable=True))
    op.add_column(
        "venue_pricing",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "venue_pricing",
        sa.Column(
            "extra",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.add_column("venue_pricing", sa.Column("created_by", sa.UUID(), nullable=True))
    op.add_column("venue_pricing", sa.Column("updated_by", sa.UUID(), nullable=True))
    op.add_column(
        "venue_pricing",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_venue_pricing_created_by_users",
        "venue_pricing",
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_venue_pricing_updated_by_users",
        "venue_pricing",
        "users",
        ["updated_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_venue_pricing_venue_active", "venue_pricing", ["venue_id", "is_active"])
    op.create_index("ix_venue_pricing_deleted_at", "venue_pricing", ["deleted_at"])

    for table in ("venue_slots", "venue_food_slots"):
        op.add_column(
            table,
            sa.Column(
                "extra",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default=sa.text("'{}'::jsonb"),
            ),
        )
        op.add_column(
            table,
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )
        op.add_column(
            table,
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )
        op.add_column(
            table,
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index(f"ix_{table}_deleted_at", table, ["deleted_at"])


def downgrade() -> None:
    for table in ("venue_food_slots", "venue_slots"):
        op.drop_index(f"ix_{table}_deleted_at", table_name=table)
        op.drop_column(table, "deleted_at")
        op.drop_column(table, "updated_at")
        op.drop_column(table, "created_at")
        op.drop_column(table, "extra")

    op.drop_index("ix_venue_pricing_deleted_at", table_name="venue_pricing")
    op.drop_index("ix_venue_pricing_venue_active", table_name="venue_pricing")
    op.drop_constraint("fk_venue_pricing_updated_by_users", "venue_pricing", type_="foreignkey")
    op.drop_constraint("fk_venue_pricing_created_by_users", "venue_pricing", type_="foreignkey")
    op.drop_column("venue_pricing", "deleted_at")
    op.drop_column("venue_pricing", "updated_by")
    op.drop_column("venue_pricing", "created_by")
    op.drop_column("venue_pricing", "extra")
    op.drop_column("venue_pricing", "is_active")
    op.drop_column("venue_pricing", "valid_to")
    op.drop_column("venue_pricing", "valid_from")
    op.drop_column("venue_pricing", "operating_end_time")
    op.drop_column("venue_pricing", "operating_start_time")
    op.drop_column("venue_pricing", "schedule_type")
    op.drop_column("venue_pricing", "name")
    op.create_unique_constraint("uq_venue_pricing_venue_id", "venue_pricing", ["venue_id"])
