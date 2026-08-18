import uuid
from datetime import UTC, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.business_profile import (
    BusinessProfile,
    BusinessProfileDocument,
    BusinessProfileStatus,
)
from app.models.venue_owner import VenueOwner


class BusinessProfileRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _not_deleted(self) -> list:
        return [
            BusinessProfile.deleted_at.is_(None),
            BusinessProfile.status != BusinessProfileStatus.DELETED.value,
        ]

    async def get_by_id(self, profile_id: uuid.UUID) -> BusinessProfile | None:
        result = await self.db.execute(
            select(BusinessProfile)
            .options(
                selectinload(BusinessProfile.venue_owner),
                selectinload(BusinessProfile.documents),
                selectinload(BusinessProfile.bank_accounts),
            )
            .where(BusinessProfile.id == profile_id, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, business_code: str) -> BusinessProfile | None:
        result = await self.db.execute(
            select(BusinessProfile).where(
                BusinessProfile.business_code == business_code, *self._not_deleted()
            )
        )
        return result.scalar_one_or_none()

    async def next_business_code(self) -> str:
        result = await self.db.execute(select(func.count()).select_from(BusinessProfile))
        count = int(result.scalar_one() or 0)
        return f"BIZ-{300100 + count + 1}"

    async def find_duplicate_legal(
        self,
        *,
        tenant_id: uuid.UUID | None,
        gst_number: str | None = None,
        pan_number: str | None = None,
        business_registration_number: str | None = None,
        exclude_id: uuid.UUID | None = None,
    ) -> BusinessProfile | None:
        conditions = []
        if gst_number:
            conditions.append(BusinessProfile.gst_number == gst_number)
        if pan_number:
            conditions.append(BusinessProfile.pan_number == pan_number)
        if business_registration_number:
            conditions.append(
                BusinessProfile.business_registration_number
                == business_registration_number
            )
        if not conditions:
            return None

        stmt = select(BusinessProfile).where(*self._not_deleted(), or_(*conditions))
        if tenant_id is not None:
            stmt = stmt.where(BusinessProfile.tenant_id == tenant_id)
        else:
            stmt = stmt.where(BusinessProfile.tenant_id.is_(None))
        if exclude_id is not None:
            stmt = stmt.where(BusinessProfile.id != exclude_id)
        result = await self.db.execute(stmt.limit(1))
        return result.scalar_one_or_none()

    async def create(self, profile: BusinessProfile) -> BusinessProfile:
        self.db.add(profile)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def soft_delete(
        self, profile: BusinessProfile, updated_by: uuid.UUID | None = None
    ) -> BusinessProfile:
        profile.deleted_at = datetime.now(UTC)
        profile.status = BusinessProfileStatus.DELETED.value
        profile.updated_by = updated_by
        await self.db.flush()
        return profile

    async def count_by_venue_owner(self, venue_owner_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(BusinessProfile)
            .where(
                BusinessProfile.venue_owner_id == venue_owner_id,
                *self._not_deleted(),
            )
        )
        return int(result.scalar_one() or 0)

    async def list_by_venue_owner(
        self, venue_owner_id: uuid.UUID, *, limit: int = 50
    ) -> list[BusinessProfile]:
        result = await self.db.execute(
            select(BusinessProfile)
            .where(
                BusinessProfile.venue_owner_id == venue_owner_id,
                *self._not_deleted(),
            )
            .order_by(BusinessProfile.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    def build_list_query(
        self,
        *,
        search: str | None = None,
        status: str | None = None,
        verification_status: str | None = None,
        business_type: str | None = None,
        city: str | None = None,
        venue_owner_id: uuid.UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> Select:
        stmt = (
            select(BusinessProfile)
            .join(VenueOwner, VenueOwner.id == BusinessProfile.venue_owner_id)
            .where(*self._not_deleted())
        )
        if venue_owner_id is not None:
            stmt = stmt.where(BusinessProfile.venue_owner_id == venue_owner_id)
        if search:
            q = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    BusinessProfile.business_name.ilike(q),
                    BusinessProfile.business_code.ilike(q),
                    BusinessProfile.gst_number.ilike(q),
                    VenueOwner.full_name.ilike(q),
                )
            )
        if status:
            stmt = stmt.where(BusinessProfile.status == status)
        if verification_status:
            stmt = stmt.where(BusinessProfile.verification_status == verification_status)
        if business_type:
            stmt = stmt.where(BusinessProfile.business_type.ilike(business_type))
        if city:
            stmt = stmt.where(BusinessProfile.city.ilike(city))
        if date_from:
            stmt = stmt.where(BusinessProfile.created_at >= date_from)
        if date_to:
            stmt = stmt.where(BusinessProfile.created_at <= date_to)
        return stmt

    async def list_profiles(
        self,
        *,
        search: str | None = None,
        status: str | None = None,
        verification_status: str | None = None,
        business_type: str | None = None,
        city: str | None = None,
        venue_owner_id: uuid.UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sort_by: str = "business_name",
        sort_dir: str = "asc",
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[BusinessProfile], int]:
        base = self.build_list_query(
            search=search,
            status=status,
            verification_status=verification_status,
            business_type=business_type,
            city=city,
            venue_owner_id=venue_owner_id,
            date_from=date_from,
            date_to=date_to,
        )
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        sort_map = {
            "business_name": BusinessProfile.business_name,
            "name": BusinessProfile.business_name,
            "created_at": BusinessProfile.created_at,
            "venue_count": BusinessProfile.created_at,
            "booking_count": BusinessProfile.created_at,
        }
        sort_col = sort_map.get(sort_by, BusinessProfile.business_name)
        order = sort_col.asc() if sort_dir == "asc" else sort_col.desc()
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        offset = (page - 1) * page_size
        result = await self.db.execute(
            base.options(selectinload(BusinessProfile.venue_owner))
            .order_by(order)
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().unique().all()), total

    async def distinct_cities(self) -> list[str]:
        result = await self.db.execute(
            select(BusinessProfile.city)
            .where(BusinessProfile.city.is_not(None), *self._not_deleted())
            .distinct()
            .order_by(BusinessProfile.city)
        )
        return [row[0] for row in result.all() if row[0]]

    async def get_document(
        self, document_id: uuid.UUID
    ) -> BusinessProfileDocument | None:
        result = await self.db.execute(
            select(BusinessProfileDocument).where(
                BusinessProfileDocument.id == document_id,
                BusinessProfileDocument.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def soft_delete_document(self, document: BusinessProfileDocument) -> None:
        document.deleted_at = datetime.now(UTC)
        await self.db.flush()

    async def list_active_documents(
        self, profile_id: uuid.UUID
    ) -> list[BusinessProfileDocument]:
        result = await self.db.execute(
            select(BusinessProfileDocument).where(
                BusinessProfileDocument.business_profile_id == profile_id,
                BusinessProfileDocument.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())
