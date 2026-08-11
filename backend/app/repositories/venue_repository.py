import re
import uuid
from datetime import UTC, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.venue_catalog import amenity_meta, service_icon
from app.models.business_profile import BusinessProfile
from app.models.venue import (
    EventType,
    Venue,
    VenueAmenity,
    VenueAmenityMapping,
    VenueEventMapping,
    VenuePricing,
    VenueService,
    VenueServiceMapping,
    VenueStatus,
)
from app.models.venue_owner import VenueOwner


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_") or "item"


class VenueRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _not_deleted(self) -> list:
        return [
            Venue.deleted_at.is_(None),
            Venue.venue_status != VenueStatus.DELETED.value,
        ]

    def _detail_options(self):
        return [
            selectinload(Venue.business_profile).selectinload(BusinessProfile.venue_owner),
            selectinload(Venue.pricing_records).selectinload(VenuePricing.slots),
            selectinload(Venue.pricing_records).selectinload(VenuePricing.food_slots),
            selectinload(Venue.gallery_items),
            selectinload(Venue.documents),
            selectinload(Venue.amenity_links).selectinload(VenueAmenityMapping.amenity),
            selectinload(Venue.service_links).selectinload(VenueServiceMapping.service),
            selectinload(Venue.event_links).selectinload(VenueEventMapping.event_type),
            selectinload(Venue.faqs),
            selectinload(Venue.review_items),
        ]

    async def get_by_id(self, venue_id: uuid.UUID) -> Venue | None:
        result = await self.db.execute(
            select(Venue)
            .options(*self._detail_options())
            .where(Venue.id == venue_id, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def next_venue_code(self) -> str:
        result = await self.db.execute(select(func.count()).select_from(Venue))
        count = int(result.scalar_one() or 0)
        return f"VEN-{40000 + count + 1}"

    async def create(self, venue: Venue) -> Venue:
        self.db.add(venue)
        await self.db.flush()
        await self.db.refresh(venue)
        return venue

    async def soft_delete(
        self, venue: Venue, updated_by: uuid.UUID | None = None
    ) -> Venue:
        venue.deleted_at = datetime.now(UTC)
        venue.venue_status = VenueStatus.DELETED.value
        venue.updated_by = updated_by
        await self.db.flush()
        return venue

    async def count_by_business_profile(self, business_profile_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Venue)
            .where(
                Venue.business_profile_id == business_profile_id,
                *self._not_deleted(),
            )
        )
        return int(result.scalar_one() or 0)

    async def count_by_status_for_business(
        self, business_profile_id: uuid.UUID
    ) -> dict[str, int]:
        result = await self.db.execute(
            select(Venue.venue_status, func.count())
            .where(
                Venue.business_profile_id == business_profile_id,
                *self._not_deleted(),
            )
            .group_by(Venue.venue_status)
        )
        return {row[0]: int(row[1]) for row in result.all()}

    async def list_by_venue_owner(
        self, venue_owner_id: uuid.UUID, *, limit: int = 20
    ) -> list[Venue]:
        result = await self.db.execute(
            select(Venue)
            .join(BusinessProfile, BusinessProfile.id == Venue.business_profile_id)
            .where(
                BusinessProfile.venue_owner_id == venue_owner_id,
                *self._not_deleted(),
            )
            .order_by(Venue.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_venue_owner(self, venue_owner_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Venue)
            .join(BusinessProfile, BusinessProfile.id == Venue.business_profile_id)
            .where(
                BusinessProfile.venue_owner_id == venue_owner_id,
                *self._not_deleted(),
            )
        )
        return int(result.scalar_one() or 0)

    async def list_by_business_profile(
        self, business_profile_id: uuid.UUID, *, limit: int = 50
    ) -> list[Venue]:
        result = await self.db.execute(
            select(Venue)
            .where(
                Venue.business_profile_id == business_profile_id,
                *self._not_deleted(),
            )
            .order_by(Venue.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    def build_list_query(
        self,
        *,
        search: str | None = None,
        venue_status: str | None = None,
        approval_status: str | None = None,
        category: str | None = None,
        venue_type: str | None = None,
        city: str | None = None,
        business_profile_id: uuid.UUID | None = None,
        venue_owner_id: uuid.UUID | None = None,
        published_only: bool = False,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> Select:
        stmt = (
            select(Venue)
            .join(BusinessProfile, BusinessProfile.id == Venue.business_profile_id)
            .outerjoin(VenueOwner, VenueOwner.id == BusinessProfile.venue_owner_id)
            .where(*self._not_deleted())
        )
        if published_only:
            stmt = stmt.where(
                Venue.venue_status == VenueStatus.PUBLISHED.value,
                Venue.approval_status == "approved",
            )
        if venue_owner_id is not None:
            stmt = stmt.where(BusinessProfile.venue_owner_id == venue_owner_id)
        if business_profile_id is not None:
            stmt = stmt.where(Venue.business_profile_id == business_profile_id)
        if search:
            q = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Venue.venue_name.ilike(q),
                    Venue.venue_code.ilike(q),
                    Venue.city.ilike(q),
                    BusinessProfile.business_name.ilike(q),
                )
            )
        if venue_status:
            stmt = stmt.where(Venue.venue_status == venue_status)
        if approval_status:
            stmt = stmt.where(Venue.approval_status == approval_status)
        if category:
            stmt = stmt.where(Venue.category.ilike(category))
        if venue_type:
            stmt = stmt.where(Venue.venue_type.ilike(venue_type))
        if city:
            stmt = stmt.where(Venue.city.ilike(city))
        if date_from:
            stmt = stmt.where(Venue.created_at >= date_from)
        if date_to:
            stmt = stmt.where(Venue.created_at <= date_to)
        return stmt

    async def list_venues(
        self,
        *,
        search: str | None = None,
        venue_status: str | None = None,
        approval_status: str | None = None,
        category: str | None = None,
        venue_type: str | None = None,
        city: str | None = None,
        business_profile_id: uuid.UUID | None = None,
        venue_owner_id: uuid.UUID | None = None,
        published_only: bool = False,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sort_by: str = "venue_name",
        sort_dir: str = "asc",
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Venue], int]:
        base = self.build_list_query(
            search=search,
            venue_status=venue_status,
            approval_status=approval_status,
            category=category,
            venue_type=venue_type,
            city=city,
            business_profile_id=business_profile_id,
            venue_owner_id=venue_owner_id,
            published_only=published_only,
            date_from=date_from,
            date_to=date_to,
        )
        total = int(
            (await self.db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
            or 0
        )
        sort_map = {
            "venue_name": Venue.venue_name,
            "name": Venue.venue_name,
            "created_at": Venue.created_at,
            "city": Venue.city,
            "capacity": Venue.seating_capacity,
        }
        sort_col = sort_map.get(sort_by, Venue.venue_name)
        order = sort_col.asc().nullslast() if sort_dir == "asc" else sort_col.desc().nullslast()
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        offset = (page - 1) * page_size
        result = await self.db.execute(
            base.options(
                selectinload(Venue.business_profile).selectinload(BusinessProfile.venue_owner),
                selectinload(Venue.pricing_records).selectinload(VenuePricing.slots),
                selectinload(Venue.pricing_records).selectinload(VenuePricing.food_slots),
            )
            .order_by(order)
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().unique().all()), total

    async def distinct_cities(self) -> list[str]:
        result = await self.db.execute(
            select(Venue.city)
            .where(Venue.city.is_not(None), *self._not_deleted())
            .distinct()
            .order_by(Venue.city)
        )
        return [row[0] for row in result.all() if row[0]]

    async def get_or_create_amenity(self, name: str) -> VenueAmenity:
        cleaned = name.strip()
        code = _slug(cleaned)
        result = await self.db.execute(
            select(VenueAmenity).where(
                or_(VenueAmenity.code == code, VenueAmenity.name.ilike(cleaned))
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            if not existing.icon or not existing.category:
                icon, category = amenity_meta(existing.code, existing.name)
                existing.icon = existing.icon or icon
                existing.category = existing.category or category
            return existing
        icon, category = amenity_meta(code, cleaned)
        item = VenueAmenity(code=code, name=cleaned, icon=icon, category=category)
        self.db.add(item)
        await self.db.flush()
        return item

    async def get_or_create_service(self, name: str) -> VenueService:
        cleaned = name.strip()
        code = _slug(cleaned)
        result = await self.db.execute(
            select(VenueService).where(
                or_(VenueService.code == code, VenueService.name.ilike(cleaned))
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            if not existing.icon:
                existing.icon = service_icon(existing.code, existing.name)
            return existing
        item = VenueService(code=code, name=cleaned, icon=service_icon(code, cleaned))
        self.db.add(item)
        await self.db.flush()
        return item

    async def get_or_create_event_type(self, name: str) -> EventType:
        cleaned = name.strip()
        code = _slug(cleaned)
        result = await self.db.execute(
            select(EventType).where(
                or_(EventType.code == code, EventType.name.ilike(cleaned))
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        item = EventType(code=code, name=cleaned)
        self.db.add(item)
        await self.db.flush()
        return item

    async def list_amenities(self) -> list[VenueAmenity]:
        result = await self.db.execute(
            select(VenueAmenity)
            .where(VenueAmenity.is_active.is_(True))
            .order_by(VenueAmenity.display_order, VenueAmenity.name)
        )
        return list(result.scalars().all())

    async def list_services(self) -> list[VenueService]:
        result = await self.db.execute(
            select(VenueService)
            .where(VenueService.is_active.is_(True))
            .order_by(VenueService.display_order, VenueService.name)
        )
        return list(result.scalars().all())

    async def list_event_types(self) -> list[EventType]:
        result = await self.db.execute(
            select(EventType)
            .where(EventType.is_active.is_(True))
            .order_by(EventType.display_order, EventType.name)
        )
        return list(result.scalars().all())

    async def list_related(self, venue: Venue, *, limit: int = 6) -> list[Venue]:
        if not venue.city:
            return []
        result = await self.db.execute(
            select(Venue)
            .options(
                selectinload(Venue.pricing_records).selectinload(VenuePricing.slots),
                selectinload(Venue.pricing_records).selectinload(VenuePricing.food_slots),
            )
            .where(
                Venue.id != venue.id,
                Venue.city == venue.city,
                Venue.venue_status == VenueStatus.PUBLISHED.value,
                *self._not_deleted(),
            )
            .order_by(Venue.featured.desc(), Venue.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def list_similar(
        self, venue: Venue, *, exclude_ids: list[uuid.UUID] | None = None, limit: int = 6
    ) -> list[Venue]:
        if not venue.category:
            return []
        excluded = set(exclude_ids or [])
        excluded.add(venue.id)
        result = await self.db.execute(
            select(Venue)
            .options(
                selectinload(Venue.pricing_records).selectinload(VenuePricing.slots),
                selectinload(Venue.pricing_records).selectinload(VenuePricing.food_slots),
            )
            .where(
                Venue.id.notin_(list(excluded)),
                Venue.category == venue.category,
                Venue.venue_status == VenueStatus.PUBLISHED.value,
                *self._not_deleted(),
            )
            .order_by(Venue.featured.desc(), Venue.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().unique().all())
