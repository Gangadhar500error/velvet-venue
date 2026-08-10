"""create customers table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-10 16:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("customer_code", sa.String(length=30), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("mobile", sa.String(length=20), nullable=False),
        sa.Column("alternate_mobile", sa.String(length=20), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("profile_image", sa.String(length=500), nullable=True),
        sa.Column("gender", sa.String(length=30), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("registration_source", sa.String(length=30), nullable=False),
        sa.Column("customer_type", sa.String(length=30), nullable=False),
        sa.Column("email_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("mobile_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("verification_status", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("address_line1", sa.String(length=255), nullable=True),
        sa.Column("address_line2", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "communication_preference",
            sa.String(length=20),
            server_default="email",
            nullable=False,
        ),
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
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("customer_code", name="uq_customers_customer_code"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_customers_tenant_id", "customers", ["tenant_id"], unique=False)
    op.create_index("ix_customers_user_id", "customers", ["user_id"], unique=True)
    op.create_index("ix_customers_customer_code", "customers", ["customer_code"], unique=False)
    op.create_index("ix_customers_full_name", "customers", ["full_name"], unique=False)
    op.create_index("ix_customers_email", "customers", ["email"], unique=False)
    op.create_index("ix_customers_mobile", "customers", ["mobile"], unique=False)
    op.create_index("ix_customers_email_active", "customers", ["email"], unique=False)
    op.create_index("ix_customers_mobile_active", "customers", ["mobile"], unique=False)
    op.create_index(
        "ix_customers_registration_source", "customers", ["registration_source"], unique=False
    )
    op.create_index(
        "ix_customers_verification_status", "customers", ["verification_status"], unique=False
    )
    op.create_index("ix_customers_status", "customers", ["status"], unique=False)
    op.create_index("ix_customers_city", "customers", ["city"], unique=False)
    op.create_index("ix_customers_created_at", "customers", ["created_at"], unique=False)
    op.create_index("ix_customers_deleted_at", "customers", ["deleted_at"], unique=False)
    op.create_index(
        "ix_customers_tenant_created", "customers", ["tenant_id", "created_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_customers_tenant_created", table_name="customers")
    op.drop_index("ix_customers_deleted_at", table_name="customers")
    op.drop_index("ix_customers_created_at", table_name="customers")
    op.drop_index("ix_customers_city", table_name="customers")
    op.drop_index("ix_customers_status", table_name="customers")
    op.drop_index("ix_customers_verification_status", table_name="customers")
    op.drop_index("ix_customers_registration_source", table_name="customers")
    op.drop_index("ix_customers_mobile_active", table_name="customers")
    op.drop_index("ix_customers_email_active", table_name="customers")
    op.drop_index("ix_customers_mobile", table_name="customers")
    op.drop_index("ix_customers_email", table_name="customers")
    op.drop_index("ix_customers_full_name", table_name="customers")
    op.drop_index("ix_customers_customer_code", table_name="customers")
    op.drop_index("ix_customers_user_id", table_name="customers")
    op.drop_index("ix_customers_tenant_id", table_name="customers")
    op.drop_table("customers")
