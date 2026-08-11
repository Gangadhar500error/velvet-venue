"""Venue detail production columns, FAQs, reviews, uniqueness.

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
"""

from alembic import op
import sqlalchemy as sa

revision = "c9d0e1f2a3b4"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("venues", sa.Column("seo_title", sa.String(length=255), nullable=True))
    op.add_column("venues", sa.Column("seo_description", sa.Text(), nullable=True))
    op.add_column("venues", sa.Column("seo_keywords", sa.String(length=500), nullable=True))
    op.add_column("venues", sa.Column("seo_canonical", sa.String(length=500), nullable=True))

    op.add_column("venue_amenities", sa.Column("icon", sa.String(length=80), nullable=True))
    op.add_column("venue_amenities", sa.Column("category", sa.String(length=80), nullable=True))
    op.add_column("venue_services", sa.Column("icon", sa.String(length=80), nullable=True))
    op.add_column("venue_services", sa.Column("description", sa.Text(), nullable=True))
    op.execute(
        "UPDATE venue_amenities SET icon = 'Car', category = 'Parking' "
        "WHERE icon IS NULL AND (lower(code) LIKE '%parking%' OR lower(name) LIKE '%parking%')"
    )
    op.execute(
        "UPDATE venue_amenities SET icon = 'Snowflake', category = 'Climate' "
        "WHERE icon IS NULL AND (lower(code) IN ('ac', 'air_conditioning') "
        "OR lower(name) IN ('ac', 'air conditioning'))"
    )
    op.execute(
        "UPDATE venue_amenities SET icon = 'Wifi', category = 'Connectivity' "
        "WHERE icon IS NULL AND lower(code) LIKE '%wifi%'"
    )
    op.execute(
        "UPDATE venue_amenities SET icon = 'Zap', category = 'Utilities' "
        "WHERE icon IS NULL AND (lower(code) LIKE '%power%' OR lower(name) LIKE '%backup%')"
    )
    op.execute(
        "UPDATE venue_amenities SET icon = 'Music', category = 'Entertainment' "
        "WHERE icon IS NULL AND lower(code) LIKE '%music%'"
    )
    op.execute(
        "UPDATE venue_amenities SET icon = 'Disc3', category = 'Entertainment' "
        "WHERE icon IS NULL AND lower(code) LIKE '%dj%'"
    )
    op.execute(
        "UPDATE venue_amenities SET icon = 'Sparkles', category = 'General' WHERE icon IS NULL"
    )
    op.execute(
        "UPDATE venue_services SET icon = 'PartyPopper' "
        "WHERE icon IS NULL AND lower(code) LIKE '%decor%'"
    )
    op.execute(
        "UPDATE venue_services SET icon = 'Disc3' WHERE icon IS NULL AND lower(code) LIKE '%dj%'"
    )
    op.execute(
        "UPDATE venue_services SET icon = 'ChefHat' "
        "WHERE icon IS NULL AND lower(code) LIKE '%cater%'"
    )
    op.execute(
        "UPDATE venue_services SET icon = 'Camera' "
        "WHERE icon IS NULL AND lower(code) LIKE '%photo%'"
    )
    op.execute("UPDATE venue_services SET icon = 'Layers' WHERE icon IS NULL")

    op.add_column("venue_gallery", sa.Column("thumbnail_url", sa.String(length=500), nullable=True))
    op.add_column("venue_gallery", sa.Column("title", sa.String(length=255), nullable=True))
    op.add_column(
        "venue_gallery",
        sa.Column("media_type", sa.String(length=30), server_default="image", nullable=False),
    )
    op.add_column(
        "venue_gallery",
        sa.Column("is_cover", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.execute(
        """
        UPDATE venue_gallery
        SET thumbnail_url = image_url,
            title = caption,
            media_type = CASE WHEN image_type = '360' THEN '360' ELSE 'image' END,
            is_cover = (image_type = 'cover')
        """
    )

    op.add_column("venue_documents", sa.Column("expiry_date", sa.Date(), nullable=True))
    op.add_column(
        "venue_documents", sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True)
    )

    op.create_table(
        "venue_faqs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("question", sa.String(length=500), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
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
    op.create_index("ix_venue_faqs_venue_id", "venue_faqs", ["venue_id"])

    op.create_table(
        "venue_reviews",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("customer_id", sa.UUID(), nullable=True),
        sa.Column("customer_name", sa.String(length=150), server_default="Guest", nullable=False),
        sa.Column("rating", sa.Integer(), server_default="5", nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=True),
        sa.Column("booking_id", sa.UUID(), nullable=True),
        sa.Column("reply", sa.Text(), nullable=True),
        sa.Column("reply_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_published", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_venue_reviews_venue_id", "venue_reviews", ["venue_id"])
    op.create_index("ix_venue_reviews_created_at", "venue_reviews", ["created_at"])
    op.create_index(
        "ix_venue_reviews_venue_created", "venue_reviews", ["venue_id", "created_at"]
    )

    op.execute(
        """
        UPDATE venue_slots s SET deleted_at = now(), enabled = false
        WHERE s.deleted_at IS NULL
          AND s.id NOT IN (
            SELECT DISTINCT ON (venue_pricing_id, slot_key) id
            FROM venue_slots
            WHERE deleted_at IS NULL
            ORDER BY venue_pricing_id, slot_key, created_at
          )
        """
    )
    op.execute(
        """
        UPDATE venue_food_slots s SET deleted_at = now(), enabled = false
        WHERE s.deleted_at IS NULL
          AND s.id NOT IN (
            SELECT DISTINCT ON (venue_pricing_id, meal_key) id
            FROM venue_food_slots
            WHERE deleted_at IS NULL
            ORDER BY venue_pricing_id, meal_key, created_at
          )
        """
    )
    op.execute(
        """
        UPDATE venue_gallery g SET deleted_at = now()
        WHERE g.deleted_at IS NULL
          AND g.id NOT IN (
            SELECT DISTINCT ON (venue_id, image_url) id
            FROM venue_gallery
            WHERE deleted_at IS NULL
            ORDER BY venue_id, image_url, created_at
          )
        """
    )
    op.execute(
        """
        UPDATE venue_documents d SET deleted_at = now()
        WHERE d.deleted_at IS NULL
          AND d.id NOT IN (
            SELECT DISTINCT ON (venue_id, document_type) id
            FROM venue_documents
            WHERE deleted_at IS NULL
            ORDER BY venue_id, document_type, created_at
          )
        """
    )

    op.create_index(
        "uq_venue_slots_pricing_key",
        "venue_slots",
        ["venue_pricing_id", "slot_key"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "uq_venue_food_slots_pricing_key",
        "venue_food_slots",
        ["venue_pricing_id", "meal_key"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "uq_venue_gallery_url",
        "venue_gallery",
        ["venue_id", "image_url"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "uq_venue_documents_type",
        "venue_documents",
        ["venue_id", "document_type"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_venue_documents_type", table_name="venue_documents")
    op.drop_index("uq_venue_gallery_url", table_name="venue_gallery")
    op.drop_index("uq_venue_food_slots_pricing_key", table_name="venue_food_slots")
    op.drop_index("uq_venue_slots_pricing_key", table_name="venue_slots")
    op.drop_index("ix_venue_reviews_venue_created", table_name="venue_reviews")
    op.drop_index("ix_venue_reviews_created_at", table_name="venue_reviews")
    op.drop_index("ix_venue_reviews_venue_id", table_name="venue_reviews")
    op.drop_table("venue_reviews")
    op.drop_index("ix_venue_faqs_venue_id", table_name="venue_faqs")
    op.drop_table("venue_faqs")
    op.drop_column("venue_documents", "verified_at")
    op.drop_column("venue_documents", "expiry_date")
    op.drop_column("venue_gallery", "is_cover")
    op.drop_column("venue_gallery", "media_type")
    op.drop_column("venue_gallery", "title")
    op.drop_column("venue_gallery", "thumbnail_url")
    op.drop_column("venue_services", "description")
    op.drop_column("venue_services", "icon")
    op.drop_column("venue_amenities", "category")
    op.drop_column("venue_amenities", "icon")
    op.drop_column("venues", "seo_canonical")
    op.drop_column("venues", "seo_keywords")
    op.drop_column("venues", "seo_description")
    op.drop_column("venues", "seo_title")
