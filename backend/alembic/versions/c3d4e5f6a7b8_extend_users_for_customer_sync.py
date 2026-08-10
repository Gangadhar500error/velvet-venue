"""extend users for customer auth sync

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-10 16:25:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("tenant_id", sa.UUID(), nullable=True))
    op.add_column("users", sa.Column("full_name", sa.String(length=200), nullable=True))
    op.add_column("users", sa.Column("mobile", sa.String(length=20), nullable=True))
    op.add_column(
        "users",
        sa.Column("email_verified", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("mobile_verified", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("status", sa.String(length=20), server_default="active", nullable=False),
    )
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))

    # Allow pending activation accounts created by admin/vendor.
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)

    op.create_index("ix_users_tenant_id", "users", ["tenant_id"], unique=False)
    op.create_index("ix_users_mobile", "users", ["mobile"], unique=False)
    op.create_index("ix_users_full_name", "users", ["full_name"], unique=False)
    op.create_index("ix_users_status", "users", ["status"], unique=False)

    # Backfill from existing columns.
    op.execute(
        """
        UPDATE users
        SET
            full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))),
            mobile = phone,
            email_verified = is_verified,
            status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END
        """
    )


def downgrade() -> None:
    op.drop_index("ix_users_status", table_name="users")
    op.drop_index("ix_users_full_name", table_name="users")
    op.drop_index("ix_users_mobile", table_name="users")
    op.drop_index("ix_users_tenant_id", table_name="users")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "status")
    op.drop_column("users", "mobile_verified")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "mobile")
    op.drop_column("users", "full_name")
    op.drop_column("users", "tenant_id")
