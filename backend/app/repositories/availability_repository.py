import uuid
from datetime import date, datetime

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.availability import (
    VenueAvailability,
    VenueAvailabilityBlock,
    VenueAvailabilityLog,
    VenueSlotAvailability,
)


class AvailabilityRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _with_slots(self) -> list:
        return [selectinload(VenueAvailability.slots)]

    async def get_day(
        self, venue_id: uuid.UUID, availability_date: date
    ) -> VenueAvailability | None:
        result = await self.db.execute(
            select(VenueAvailability)
            .options(*self._with_slots())
            .where(
                VenueAvailability.venue_id == venue_id,
                VenueAvailability.availability_date == availability_date,
            )
        )
        return result.scalar_one_or_none()

    async def get_day_for_update(
        self, venue_id: uuid.UUID, availability_date: date
    ) -> VenueAvailability | None:
        result = await self.db.execute(
            select(VenueAvailability)
            .options(*self._with_slots())
            .where(
                VenueAvailability.venue_id == venue_id,
                VenueAvailability.availability_date == availability_date,
            )
            .with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, availability_id: uuid.UUID) -> VenueAvailability | None:
        result = await self.db.execute(
            select(VenueAvailability)
            .options(*self._with_slots())
            .where(VenueAvailability.id == availability_id)
        )
        return result.scalar_one_or_none()

    async def list_range(
        self, venue_id: uuid.UUID, start: date, end: date
    ) -> list[VenueAvailability]:
        result = await self.db.execute(
            select(VenueAvailability)
            .options(*self._with_slots())
            .where(
                VenueAvailability.venue_id == venue_id,
                VenueAvailability.availability_date >= start,
                VenueAvailability.availability_date <= end,
            )
            .order_by(VenueAvailability.availability_date)
        )
        return list(result.scalars().unique().all())

    async def list_after(self, venue_id: uuid.UUID, after: date) -> list[VenueAvailability]:
        result = await self.db.execute(
            select(VenueAvailability)
            .options(*self._with_slots())
            .where(
                VenueAvailability.venue_id == venue_id,
                VenueAvailability.availability_date > after,
            )
            .order_by(VenueAvailability.availability_date)
        )
        return list(result.scalars().unique().all())

    async def dates_in_range(
        self, venue_id: uuid.UUID, start: date, end: date
    ) -> set[date]:
        result = await self.db.execute(
            select(VenueAvailability.availability_date).where(
                VenueAvailability.venue_id == venue_id,
                VenueAvailability.availability_date >= start,
                VenueAvailability.availability_date <= end,
            )
        )
        return set(result.scalars().all())

    async def add(self, row: VenueAvailability) -> VenueAvailability:
        self.db.add(row)
        await self.db.flush()
        return row

    async def count_by_status(
        self, venue_id: uuid.UUID, start: date, end: date
    ) -> dict[str, int]:
        result = await self.db.execute(
            select(VenueAvailability.status, func.count())
            .where(
                VenueAvailability.venue_id == venue_id,
                VenueAvailability.availability_date >= start,
                VenueAvailability.availability_date <= end,
            )
            .group_by(VenueAvailability.status)
        )
        return {str(status): int(count) for status, count in result.all()}

    def _filtered_query(
        self,
        venue_id: uuid.UUID,
        *,
        start: date | None = None,
        end: date | None = None,
        status: str | None = None,
        slot_key: str | None = None,
        booking_status: str | None = None,
        search: str | None = None,
        customer: str | None = None,
    ) -> Select:
        stmt = (
            select(VenueAvailability)
            .options(*self._with_slots())
            .where(VenueAvailability.venue_id == venue_id)
        )
        if start is not None:
            stmt = stmt.where(VenueAvailability.availability_date >= start)
        if end is not None:
            stmt = stmt.where(VenueAvailability.availability_date <= end)
        if status:
            stmt = stmt.where(VenueAvailability.status == status)
        needs_slot_join = any([slot_key, booking_status, search, customer])
        if needs_slot_join:
            stmt = stmt.join(VenueSlotAvailability)
            if slot_key:
                stmt = stmt.where(VenueSlotAvailability.slot_key == slot_key)
            if booking_status:
                stmt = stmt.where(VenueSlotAvailability.status == booking_status)
            if search:
                q = f"%{search.strip()}%"
                stmt = stmt.where(
                    or_(
                        VenueSlotAvailability.booking_ref.ilike(q),
                        VenueSlotAvailability.customer_name.ilike(q),
                        VenueSlotAvailability.event_type.ilike(q),
                    )
                )
            if customer:
                stmt = stmt.where(
                    VenueSlotAvailability.customer_name.ilike(f"%{customer.strip()}%")
                )
            stmt = stmt.distinct()
        return stmt.order_by(VenueAvailability.availability_date)

    async def list_filtered(
        self,
        venue_id: uuid.UUID,
        *,
        start: date | None = None,
        end: date | None = None,
        status: str | None = None,
        slot_key: str | None = None,
        booking_status: str | None = None,
        search: str | None = None,
        customer: str | None = None,
        page: int = 1,
        page_size: int = 31,
    ) -> tuple[list[VenueAvailability], int]:
        stmt = self._filtered_query(
            venue_id,
            start=start,
            end=end,
            status=status,
            slot_key=slot_key,
            booking_status=booking_status,
            search=search,
            customer=customer,
        )
        count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)
        result = await self.db.execute(stmt.offset((page - 1) * page_size).limit(page_size))
        return list(result.scalars().unique().all()), total


class AvailabilitySlotRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def add(self, row: VenueSlotAvailability) -> VenueSlotAvailability:
        self.db.add(row)
        await self.db.flush()
        return row

    async def list_for_booking(self, booking_id: uuid.UUID) -> list[VenueSlotAvailability]:
        result = await self.db.execute(
            select(VenueSlotAvailability)
            .options(
                selectinload(VenueSlotAvailability.availability).selectinload(
                    VenueAvailability.slots
                )
            )
            .where(VenueSlotAvailability.booking_id == booking_id)
        )
        return list(result.scalars().all())

    async def todays_booking_count(self, venue_id: uuid.UUID, today: date) -> int:
        result = await self.db.execute(
            select(func.count(func.distinct(VenueSlotAvailability.booking_id)))
            .join(VenueAvailability)
            .where(
                VenueAvailability.venue_id == venue_id,
                VenueAvailability.availability_date == today,
                VenueSlotAvailability.booking_id.is_not(None),
                VenueSlotAvailability.status.in_(("booked", "completed")),
            )
        )
        return int(result.scalar_one() or 0)

    async def booking_summary(self, venue_id: uuid.UUID, today: date) -> dict[str, int]:
        def _count():
            return select(func.count(func.distinct(VenueSlotAvailability.booking_id))).join(
                VenueAvailability
            ).where(
                VenueAvailability.venue_id == venue_id,
                VenueSlotAvailability.booking_id.is_not(None),
            )

        today_count = int(
            (
                await self.db.execute(
                    _count().where(
                        VenueAvailability.availability_date == today,
                        VenueSlotAvailability.status.in_(("booked", "completed")),
                    )
                )
            ).scalar_one()
            or 0
        )
        upcoming = int(
            (
                await self.db.execute(
                    _count().where(
                        VenueAvailability.availability_date > today,
                        VenueSlotAvailability.status == "booked",
                    )
                )
            ).scalar_one()
            or 0
        )
        completed = int(
            (
                await self.db.execute(
                    _count().where(VenueSlotAvailability.status == "completed")
                )
            ).scalar_one()
            or 0
        )
        cancelled = int(
            (
                await self.db.execute(
                    _count().where(VenueSlotAvailability.status == "cancelled")
                )
            ).scalar_one()
            or 0
        )
        return {
            "today_bookings": today_count,
            "upcoming_bookings": upcoming,
            "completed_bookings": completed,
            "cancelled_bookings": cancelled,
        }


class AvailabilityBlockRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, block_id: uuid.UUID) -> VenueAvailabilityBlock | None:
        result = await self.db.execute(
            select(VenueAvailabilityBlock).where(
                VenueAvailabilityBlock.id == block_id,
                VenueAvailabilityBlock.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_active(
        self, venue_id: uuid.UUID, start: date | None = None, end: date | None = None
    ) -> list[VenueAvailabilityBlock]:
        stmt = select(VenueAvailabilityBlock).where(
            VenueAvailabilityBlock.venue_id == venue_id,
            VenueAvailabilityBlock.is_active.is_(True),
            VenueAvailabilityBlock.deleted_at.is_(None),
        )
        if start is not None and end is not None:
            stmt = stmt.where(
                or_(
                    and_(
                        VenueAvailabilityBlock.start_date <= end,
                        VenueAvailabilityBlock.end_date >= start,
                    ),
                    VenueAvailabilityBlock.recurrence_type != "none",
                )
            )
        result = await self.db.execute(
            stmt.order_by(VenueAvailabilityBlock.start_date, VenueAvailabilityBlock.created_at)
        )
        return list(result.scalars().all())

    async def add(self, row: VenueAvailabilityBlock) -> VenueAvailabilityBlock:
        self.db.add(row)
        await self.db.flush()
        return row

    async def soft_delete(self, row: VenueAvailabilityBlock) -> None:
        from datetime import UTC

        row.deleted_at = datetime.now(UTC)
        row.is_active = False
        await self.db.flush()


class AvailabilityLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def add(
        self,
        *,
        availability_id: uuid.UUID,
        action: str,
        old_status: str | None = None,
        new_status: str | None = None,
        performed_by: uuid.UUID | None = None,
        slot_availability_id: uuid.UUID | None = None,
        notes: str | None = None,
    ) -> VenueAvailabilityLog:
        row = VenueAvailabilityLog(
            id=uuid.uuid4(),
            availability_id=availability_id,
            slot_availability_id=slot_availability_id,
            action=action,
            old_status=old_status,
            new_status=new_status,
            performed_by=performed_by,
            notes=notes,
        )
        self.db.add(row)
        await self.db.flush()
        return row
