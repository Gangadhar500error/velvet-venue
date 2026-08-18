"""Add venues.booking_type for multi-select booking offerings.

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f2a3b4c5d6e7"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "venues",
        sa.Column(
            "booking_type",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[\"venue_only\"]'::jsonb"),
        ),
    )
    # Backfill from active venue pricing when available.
    op.execute(
        """
        UPDATE venues v
        SET booking_type = jsonb_build_array(p.pricing_type)
        FROM venue_pricing p
        WHERE p.venue_id = v.id
          AND p.deleted_at IS NULL
          AND p.is_active IS TRUE
          AND p.pricing_type IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_column("venues", "booking_type")
