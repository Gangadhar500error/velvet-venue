"""create venue_owners table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-10 16:40:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "venue_owners",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("owner_code", sa.String(length=30), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("mobile", sa.String(length=20), nullable=False),
        sa.Column("alternate_mobile", sa.String(length=20), nullable=True),
        sa.Column("gender", sa.String(length=30), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("profile_image", sa.String(length=500), nullable=True),
        sa.Column("business_name", sa.String(length=200), nullable=True),
        sa.Column("business_type", sa.String(length=100), nullable=True),
        sa.Column("registration_source", sa.String(length=30), nullable=False),
        sa.Column("verification_status", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("address_line1", sa.String(length=255), nullable=True),
        sa.Column("address_line2", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("gst_number", sa.String(length=50), nullable=True),
        sa.Column("pan_number", sa.String(length=50), nullable=True),
        sa.Column("business_registration_number", sa.String(length=100), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("approved_by", sa.UUID(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_code", name="uq_venue_owners_owner_code"),
        sa.UniqueConstraint("user_id", name="uq_venue_owners_user_id"),
    )
    op.create_index("ix_venue_owners_tenant_id", "venue_owners", ["tenant_id"])
    op.create_index("ix_venue_owners_user_id", "venue_owners", ["user_id"], unique=True)
    op.create_index("ix_venue_owners_owner_code", "venue_owners", ["owner_code"])
    op.create_index("ix_venue_owners_full_name", "venue_owners", ["full_name"])
    op.create_index("ix_venue_owners_email", "venue_owners", ["email"])
    op.create_index("ix_venue_owners_mobile", "venue_owners", ["mobile"])
    op.create_index("ix_venue_owners_business_name", "venue_owners", ["business_name"])
    op.create_index("ix_venue_owners_business_type", "venue_owners", ["business_type"])
    op.create_index("ix_venue_owners_registration_source", "venue_owners", ["registration_source"])
    op.create_index("ix_venue_owners_verification_status", "venue_owners", ["verification_status"])
    op.create_index("ix_venue_owners_status", "venue_owners", ["status"])
    op.create_index("ix_venue_owners_city", "venue_owners", ["city"])
    op.create_index("ix_venue_owners_created_at", "venue_owners", ["created_at"])
    op.create_index("ix_venue_owners_deleted_at", "venue_owners", ["deleted_at"])
    op.create_index(
        "ix_venue_owners_tenant_created", "venue_owners", ["tenant_id", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_venue_owners_tenant_created", table_name="venue_owners")
    op.drop_index("ix_venue_owners_deleted_at", table_name="venue_owners")
    op.drop_index("ix_venue_owners_created_at", table_name="venue_owners")
    op.drop_index("ix_venue_owners_city", table_name="venue_owners")
    op.drop_index("ix_venue_owners_status", table_name="venue_owners")
    op.drop_index("ix_venue_owners_verification_status", table_name="venue_owners")
    op.drop_index("ix_venue_owners_registration_source", table_name="venue_owners")
    op.drop_index("ix_venue_owners_business_type", table_name="venue_owners")
    op.drop_index("ix_venue_owners_business_name", table_name="venue_owners")
    op.drop_index("ix_venue_owners_mobile", table_name="venue_owners")
    op.drop_index("ix_venue_owners_email", table_name="venue_owners")
    op.drop_index("ix_venue_owners_full_name", table_name="venue_owners")
    op.drop_index("ix_venue_owners_owner_code", table_name="venue_owners")
    op.drop_index("ix_venue_owners_user_id", table_name="venue_owners")
    op.drop_index("ix_venue_owners_tenant_id", table_name="venue_owners")
    op.drop_table("venue_owners")
