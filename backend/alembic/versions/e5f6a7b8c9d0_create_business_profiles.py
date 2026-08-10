"""create business_profiles and business_profile_documents

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-10 17:05:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "business_profiles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=True),
        sa.Column("venue_owner_id", sa.UUID(), nullable=False),
        sa.Column("business_code", sa.String(length=30), nullable=False),
        sa.Column("business_name", sa.String(length=200), nullable=False),
        sa.Column("legal_business_name", sa.String(length=200), nullable=False),
        sa.Column("business_type", sa.String(length=100), nullable=False),
        sa.Column("years_in_business", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("support_email", sa.String(length=255), nullable=True),
        sa.Column("support_phone", sa.String(length=20), nullable=True),
        sa.Column("alternate_phone", sa.String(length=20), nullable=True),
        sa.Column("address_line1", sa.String(length=255), nullable=True),
        sa.Column("address_line2", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("gst_number", sa.String(length=50), nullable=True),
        sa.Column("pan_number", sa.String(length=50), nullable=True),
        sa.Column("business_registration_number", sa.String(length=100), nullable=True),
        sa.Column("account_holder_name", sa.String(length=200), nullable=True),
        sa.Column("bank_name", sa.String(length=200), nullable=True),
        sa.Column("account_number", sa.String(length=50), nullable=True),
        sa.Column("ifsc_code", sa.String(length=20), nullable=True),
        sa.Column("cancelled_cheque_url", sa.String(length=500), nullable=True),
        sa.Column("bank_proof_file_name", sa.String(length=255), nullable=True),
        sa.Column("bank_proof_file_size", sa.String(length=50), nullable=True),
        sa.Column("bank_proof_uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verification_status", sa.String(length=20), nullable=False),
        sa.Column("verification_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by", sa.UUID(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_reason", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["venue_owner_id"], ["venue_owners.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_code", name="uq_business_profiles_business_code"),
    )
    op.create_index("ix_business_profiles_tenant_id", "business_profiles", ["tenant_id"])
    op.create_index(
        "ix_business_profiles_venue_owner_id", "business_profiles", ["venue_owner_id"]
    )
    op.create_index(
        "ix_business_profiles_business_code", "business_profiles", ["business_code"]
    )
    op.create_index(
        "ix_business_profiles_business_name", "business_profiles", ["business_name"]
    )
    op.create_index(
        "ix_business_profiles_business_type", "business_profiles", ["business_type"]
    )
    op.create_index("ix_business_profiles_city", "business_profiles", ["city"])
    op.create_index("ix_business_profiles_gst_number", "business_profiles", ["gst_number"])
    op.create_index("ix_business_profiles_pan_number", "business_profiles", ["pan_number"])
    op.create_index(
        "ix_business_profiles_business_registration_number",
        "business_profiles",
        ["business_registration_number"],
    )
    op.create_index(
        "ix_business_profiles_verification_status",
        "business_profiles",
        ["verification_status"],
    )
    op.create_index("ix_business_profiles_status", "business_profiles", ["status"])
    op.create_index("ix_business_profiles_created_at", "business_profiles", ["created_at"])
    op.create_index("ix_business_profiles_deleted_at", "business_profiles", ["deleted_at"])
    op.create_index(
        "ix_business_profiles_tenant_created",
        "business_profiles",
        ["tenant_id", "created_at"],
    )

    op.create_table(
        "business_profile_documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("business_profile_id", sa.UUID(), nullable=False),
        sa.Column("document_type", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("file_size", sa.String(length=50), nullable=True),
        sa.Column("file_url", sa.String(length=500), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["business_profile_id"],
            ["business_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_bp_documents_business_profile_id",
        "business_profile_documents",
        ["business_profile_id"],
    )
    op.create_index(
        "ix_bp_documents_profile_slot",
        "business_profile_documents",
        ["business_profile_id", "document_type"],
    )


def downgrade() -> None:
    op.drop_index("ix_bp_documents_profile_slot", table_name="business_profile_documents")
    op.drop_index(
        "ix_bp_documents_business_profile_id", table_name="business_profile_documents"
    )
    op.drop_table("business_profile_documents")
    op.drop_index("ix_business_profiles_tenant_created", table_name="business_profiles")
    op.drop_index("ix_business_profiles_deleted_at", table_name="business_profiles")
    op.drop_index("ix_business_profiles_created_at", table_name="business_profiles")
    op.drop_index("ix_business_profiles_status", table_name="business_profiles")
    op.drop_index(
        "ix_business_profiles_verification_status", table_name="business_profiles"
    )
    op.drop_index(
        "ix_business_profiles_business_registration_number",
        table_name="business_profiles",
    )
    op.drop_index("ix_business_profiles_pan_number", table_name="business_profiles")
    op.drop_index("ix_business_profiles_gst_number", table_name="business_profiles")
    op.drop_index("ix_business_profiles_city", table_name="business_profiles")
    op.drop_index("ix_business_profiles_business_type", table_name="business_profiles")
    op.drop_index("ix_business_profiles_business_name", table_name="business_profiles")
    op.drop_index("ix_business_profiles_business_code", table_name="business_profiles")
    op.drop_index("ix_business_profiles_venue_owner_id", table_name="business_profiles")
    op.drop_index("ix_business_profiles_tenant_id", table_name="business_profiles")
    op.drop_table("business_profiles")
