import uuid
from datetime import UTC, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.venue_owner import VenueOwner, VenueOwnerStatus


class VenueOwnerRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _not_deleted(self) -> list:
        return [
            VenueOwner.deleted_at.is_(None),
            VenueOwner.status != VenueOwnerStatus.DELETED.value,
        ]

    async def get_by_id(self, owner_id: uuid.UUID) -> VenueOwner | None:
        result = await self.db.execute(
            select(VenueOwner).where(VenueOwner.id == owner_id, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> VenueOwner | None:
        result = await self.db.execute(
            select(VenueOwner).where(VenueOwner.user_id == user_id, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def get_by_user_id_any(self, user_id: uuid.UUID) -> VenueOwner | None:
        """Include soft-deleted rows (needed to restore / avoid unique user_id conflicts)."""
        result = await self.db.execute(
            select(VenueOwner).where(VenueOwner.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def find_by_email_any(self, email: str) -> VenueOwner | None:
        result = await self.db.execute(
            select(VenueOwner).where(func.lower(VenueOwner.email) == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def find_by_mobile_any(self, mobile: str) -> VenueOwner | None:
        cleaned = "".join(ch for ch in mobile if ch.isdigit() or ch == "+")
        result = await self.db.execute(
            select(VenueOwner).where(VenueOwner.mobile == cleaned)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, owner_code: str) -> VenueOwner | None:
        result = await self.db.execute(
            select(VenueOwner).where(
                VenueOwner.owner_code == owner_code, *self._not_deleted()
            )
        )
        return result.scalar_one_or_none()

    async def find_by_email(self, email: str) -> VenueOwner | None:
        result = await self.db.execute(
            select(VenueOwner).where(
                func.lower(VenueOwner.email) == email.lower().strip(),
                *self._not_deleted(),
            )
        )
        return result.scalar_one_or_none()

    async def find_by_mobile(self, mobile: str) -> VenueOwner | None:
        cleaned = "".join(ch for ch in mobile if ch.isdigit() or ch == "+")
        result = await self.db.execute(
            select(VenueOwner).where(VenueOwner.mobile == cleaned, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def find_by_email_or_mobile(
        self, email: str | None = None, mobile: str | None = None
    ) -> VenueOwner | None:
        if email:
            found = await self.find_by_email(email)
            if found:
                return found
        if mobile:
            return await self.find_by_mobile(mobile)
        return None

    async def next_owner_code(self) -> str:
        result = await self.db.execute(select(func.count()).select_from(VenueOwner))
        count = int(result.scalar_one() or 0)
        return f"OWN-{100000 + count + 1}"

    async def create(self, owner: VenueOwner) -> VenueOwner:
        self.db.add(owner)
        await self.db.flush()
        await self.db.refresh(owner)
        return owner

    async def soft_delete(
        self, owner: VenueOwner, updated_by: uuid.UUID | None = None
    ) -> VenueOwner:
        owner.deleted_at = datetime.now(UTC)
        owner.status = VenueOwnerStatus.DELETED.value
        owner.updated_by = updated_by
        await self.db.flush()
        return owner

    def build_list_query(
        self,
        *,
        search: str | None = None,
        status: str | None = None,
        registration_source: str | None = None,
        verification_status: str | None = None,
        city: str | None = None,
        business_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        user_id: uuid.UUID | None = None,
    ) -> Select:
        stmt = select(VenueOwner).where(*self._not_deleted())
        if user_id is not None:
            stmt = stmt.where(VenueOwner.user_id == user_id)
        if search:
            q = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    VenueOwner.full_name.ilike(q),
                    VenueOwner.owner_code.ilike(q),
                    VenueOwner.email.ilike(q),
                    VenueOwner.mobile.ilike(q),
                    VenueOwner.business_name.ilike(q),
                )
            )
        if status:
            stmt = stmt.where(VenueOwner.status == status)
        if registration_source:
            stmt = stmt.where(VenueOwner.registration_source == registration_source)
        if verification_status:
            stmt = stmt.where(VenueOwner.verification_status == verification_status)
        if city:
            stmt = stmt.where(VenueOwner.city.ilike(city))
        if business_type:
            stmt = stmt.where(VenueOwner.business_type.ilike(business_type))
        if date_from:
            stmt = stmt.where(VenueOwner.created_at >= date_from)
        if date_to:
            stmt = stmt.where(VenueOwner.created_at <= date_to)
        return stmt

    async def list_owners(
        self,
        *,
        search: str | None = None,
        status: str | None = None,
        registration_source: str | None = None,
        verification_status: str | None = None,
        city: str | None = None,
        business_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sort_by: str = "name",
        sort_dir: str = "asc",
        page: int = 1,
        page_size: int = 10,
        user_id: uuid.UUID | None = None,
    ) -> tuple[list[VenueOwner], int]:
        base = self.build_list_query(
            search=search,
            status=status,
            registration_source=registration_source,
            verification_status=verification_status,
            city=city,
            business_type=business_type,
            date_from=date_from,
            date_to=date_to,
            user_id=user_id,
        )
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        sort_map = {
            "name": VenueOwner.full_name,
            "registration_date": VenueOwner.created_at,
            "businesses": VenueOwner.created_at,
            "venues": VenueOwner.created_at,
            "revenue": VenueOwner.created_at,
        }
        sort_col = sort_map.get(sort_by, VenueOwner.full_name)
        order = sort_col.asc() if sort_dir == "asc" else sort_col.desc()
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        offset = (page - 1) * page_size
        result = await self.db.execute(
            base.order_by(order).offset(offset).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def distinct_cities(self) -> list[str]:
        result = await self.db.execute(
            select(VenueOwner.city)
            .where(VenueOwner.city.is_not(None), *self._not_deleted())
            .distinct()
            .order_by(VenueOwner.city)
        )
        return [row[0] for row in result.all() if row[0]]
