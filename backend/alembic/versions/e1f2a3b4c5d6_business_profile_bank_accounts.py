"""Create business_profile_bank_accounts and backfill existing bank fields.

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "d0e1f2a3b4c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "business_profile_bank_accounts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("business_profile_id", sa.UUID(), nullable=False),
        sa.Column("account_holder_name", sa.String(length=200), nullable=True),
        sa.Column("bank_name", sa.String(length=200), nullable=True),
        sa.Column("account_number", sa.String(length=50), nullable=True),
        sa.Column("ifsc_code", sa.String(length=20), nullable=True),
        sa.Column("cancelled_cheque_url", sa.String(length=500), nullable=True),
        sa.Column("bank_proof_file_name", sa.String(length=255), nullable=True),
        sa.Column("bank_proof_file_size", sa.String(length=50), nullable=True),
        sa.Column("bank_proof_uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
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
        sa.ForeignKeyConstraint(
            ["business_profile_id"],
            ["business_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_bp_bank_accounts_profile",
        "business_profile_bank_accounts",
        ["business_profile_id", "sort_order"],
    )
    op.create_index(
        "ix_business_profile_bank_accounts_business_profile_id",
        "business_profile_bank_accounts",
        ["business_profile_id"],
    )

    # Backfill existing single-bank fields into the new table.
    op.execute(
        """
        INSERT INTO business_profile_bank_accounts (
            id,
            business_profile_id,
            account_holder_name,
            bank_name,
            account_number,
            ifsc_code,
            cancelled_cheque_url,
            bank_proof_file_name,
            bank_proof_file_size,
            bank_proof_uploaded_at,
            is_primary,
            sort_order,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid(),
            id,
            account_holder_name,
            bank_name,
            account_number,
            ifsc_code,
            cancelled_cheque_url,
            bank_proof_file_name,
            bank_proof_file_size,
            bank_proof_uploaded_at,
            true,
            0,
            NOW(),
            NOW()
        FROM business_profiles
        WHERE deleted_at IS NULL
          AND (
            account_holder_name IS NOT NULL
            OR bank_name IS NOT NULL
            OR account_number IS NOT NULL
            OR ifsc_code IS NOT NULL
            OR bank_proof_file_name IS NOT NULL
          )
        """
    )


def downgrade() -> None:
    op.drop_index(
        "ix_business_profile_bank_accounts_business_profile_id",
        table_name="business_profile_bank_accounts",
    )
    op.drop_index("ix_bp_bank_accounts_profile", table_name="business_profile_bank_accounts")
    op.drop_table("business_profile_bank_accounts")
