import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Select, func, inspect, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import (
    ACTIVE_BOOKING_STATUSES,
    INACTIVE_BOOKING_STATUSES,
    Booking,
    BookingActivity,
    BookingDay,
    BookingFood,
    BookingService,
    BookingSlot,
    Invoice,
    Payment,
)
from app.models.business_profile import BusinessProfile
from app.models.customer import Customer
from app.models.venue import Venue
from app.models.venue_owner import VenueOwner


class BookingRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _not_deleted(self) -> list:
        return [Booking.deleted_at.is_(None)]

    def _detail_options(self):
        return [
            selectinload(Booking.customer),
            selectinload(Booking.vendor),
            selectinload(Booking.business_profile),
            selectinload(Booking.venue).selectinload(Venue.business_profile),
            selectinload(Booking.days),
            selectinload(Booking.slots),
            selectinload(Booking.food_items),
            selectinload(Booking.services),
            selectinload(Booking.payments),
            selectinload(Booking.invoices),
            selectinload(Booking.activities),
        ]

    async def get_by_id(self, booking_id: uuid.UUID) -> Booking | None:
        existing = self.db.identity_map.get(
            inspect(Booking).identity_key_from_primary_key([booking_id])
        )
        if existing is not None:
            self.db.expire(existing)
        result = await self.db.execute(
            select(Booking)
            .options(*self._detail_options())
            .where(Booking.id == booking_id, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, booking_number: str) -> Booking | None:
        result = await self.db.execute(
            select(Booking)
            .options(*self._detail_options())
            .where(Booking.booking_number == booking_number, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def next_booking_number(self) -> str:
        year = datetime.now(UTC).year % 100
        prefix = f"BK-{year:02d}"
        await self.db.execute(text("SELECT pg_advisory_xact_lock(hashtext('booking_number'))"))
        result = await self.db.execute(
            select(func.max(Booking.booking_number)).where(
                Booking.booking_number.like(f"{prefix}%")
            )
        )
        current = result.scalar_one_or_none()
        seq = 1
        if current and current.startswith(prefix):
            try:
                seq = int(current[len(prefix) :]) + 1
            except ValueError:
                seq = 1
        return f"{prefix}{seq:04d}"

    async def next_invoice_number(self, booking_number: str) -> str:
        stem = booking_number.replace("BK-", "")
        prefix = f"INV-{stem}-"
        result = await self.db.execute(
            select(func.count()).select_from(Invoice).where(Invoice.invoice_number.like(f"{prefix}%"))
        )
        seq = int(result.scalar_one() or 0) + 1
        return f"{prefix}{seq:02d}"

    async def create(self, booking: Booking) -> Booking:
        self.db.add(booking)
        await self.db.flush()
        return booking

    async def add_activity(
        self,
        booking_id: uuid.UUID,
        action: str,
        description: str,
        created_by: uuid.UUID | None = None,
    ) -> BookingActivity:
        row = BookingActivity(
            id=uuid.uuid4(),
            booking_id=booking_id,
            action=action,
            description=description,
            created_by=created_by,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def add_invoice(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        await self.db.flush()
        return invoice

    async def add_payment(self, payment: Payment) -> Payment:
        self.db.add(payment)
        await self.db.flush()
        return payment

    def _filtered(
        self,
        *,
        search: str | None = None,
        booking_status: str | None = None,
        payment_status: str | None = None,
        venue_id: uuid.UUID | None = None,
        customer_id: uuid.UUID | None = None,
        vendor_id: uuid.UUID | None = None,
        business_profile_id: uuid.UUID | None = None,
        event_date: date | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        assigned_executive: str | None = None,
    ) -> Select:
        stmt = (
            select(Booking)
            .join(Customer, Booking.customer_id == Customer.id)
            .join(Venue, Booking.venue_id == Venue.id)
            .join(BusinessProfile, Booking.business_profile_id == BusinessProfile.id)
            .join(VenueOwner, Booking.vendor_id == VenueOwner.id)
            .where(*self._not_deleted())
        )
        if search:
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Booking.booking_number.ilike(term),
                    Customer.full_name.ilike(term),
                    Customer.mobile.ilike(term),
                    Customer.email.ilike(term),
                    Venue.venue_name.ilike(term),
                    BusinessProfile.business_name.ilike(term),
                )
            )
        if booking_status:
            stmt = stmt.where(Booking.booking_status == booking_status)
        if payment_status:
            stmt = stmt.where(Booking.payment_status == payment_status)
        if venue_id:
            stmt = stmt.where(Booking.venue_id == venue_id)
        if customer_id:
            stmt = stmt.where(Booking.customer_id == customer_id)
        if vendor_id:
            stmt = stmt.where(Booking.vendor_id == vendor_id)
        if business_profile_id:
            stmt = stmt.where(Booking.business_profile_id == business_profile_id)
        if event_date:
            stmt = stmt.where(
                Booking.start_date <= event_date, Booking.end_date >= event_date
            )
        if date_from:
            stmt = stmt.where(Booking.booking_date >= date_from)
        if date_to:
            stmt = stmt.where(Booking.booking_date <= date_to)
        if assigned_executive:
            stmt = stmt.where(Booking.assigned_executive.ilike(f"%{assigned_executive}%"))
        return stmt

    async def list_bookings(
        self,
        *,
        search: str | None = None,
        booking_status: str | None = None,
        payment_status: str | None = None,
        venue_id: uuid.UUID | None = None,
        customer_id: uuid.UUID | None = None,
        vendor_id: uuid.UUID | None = None,
        business_profile_id: uuid.UUID | None = None,
        event_date: date | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        assigned_executive: str | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Booking], int]:
        base = self._filtered(
            search=search,
            booking_status=booking_status,
            payment_status=payment_status,
            venue_id=venue_id,
            customer_id=customer_id,
            vendor_id=vendor_id,
            business_profile_id=business_profile_id,
            event_date=event_date,
            date_from=date_from,
            date_to=date_to,
            assigned_executive=assigned_executive,
        )
        total = int(
            (await self.db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
            or 0
        )
        sort_map = {
            "created_at": Booking.created_at,
            "event_date": Booking.start_date,
            "booking_number": Booking.booking_number,
            "total_amount": Booking.total_amount,
        }
        sort_col = sort_map.get(sort_by, Booking.created_at)
        order = sort_col.asc() if sort_dir == "asc" else sort_col.desc()
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        result = await self.db.execute(
            base.options(*self._detail_options())
            .order_by(order)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().unique().all()), total

    async def list_for_calendar(
        self,
        *,
        start: date,
        end: date,
        venue_id: uuid.UUID | None = None,
        vendor_id: uuid.UUID | None = None,
        customer_id: uuid.UUID | None = None,
    ) -> list[Booking]:
        stmt = (
            select(Booking)
            .options(*self._detail_options())
            .where(
                Booking.deleted_at.is_(None),
                Booking.start_date <= end,
                Booking.end_date >= start,
            )
        )
        if venue_id:
            stmt = stmt.where(Booking.venue_id == venue_id)
        if vendor_id:
            stmt = stmt.where(Booking.vendor_id == vendor_id)
        if customer_id:
            stmt = stmt.where(Booking.customer_id == customer_id)
        result = await self.db.execute(stmt.order_by(Booking.start_date))
        return list(result.scalars().unique().all())

    async def list_occupying_for_venue(
        self,
        venue_id: uuid.UUID,
        start: date,
        end: date,
    ) -> list[Booking]:
        result = await self.db.execute(
            select(Booking)
            .options(*self._detail_options())
            .where(
                Booking.venue_id == venue_id,
                Booking.deleted_at.is_(None),
                Booking.booking_status.notin_(INACTIVE_BOOKING_STATUSES),
                Booking.start_date <= end,
                Booking.end_date >= start,
            )
            .order_by(Booking.start_date, Booking.created_at)
        )
        return list(result.scalars().unique().all())

    async def list_recent_for_customer(self, customer_id: uuid.UUID, limit: int = 5) -> list[Booking]:
        result = await self.db.execute(
            select(Booking)
            .options(*self._detail_options())
            .where(Booking.customer_id == customer_id, *self._not_deleted())
            .order_by(Booking.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def list_recent_for_vendor(self, vendor_id: uuid.UUID, limit: int = 5) -> list[Booking]:
        result = await self.db.execute(
            select(Booking)
            .options(*self._detail_options())
            .where(Booking.vendor_id == vendor_id, *self._not_deleted())
            .order_by(Booking.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def list_recent_invoices_for_customer(
        self, customer_id: uuid.UUID, limit: int = 5
    ) -> list[Invoice]:
        result = await self.db.execute(
            select(Invoice)
            .join(Booking)
            .where(Booking.customer_id == customer_id, Booking.deleted_at.is_(None))
            .order_by(Invoice.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def has_duplicate(
        self,
        *,
        venue_id: uuid.UUID,
        customer_id: uuid.UUID,
        start_date: date,
        slot_ids: list[uuid.UUID],
        exclude_id: uuid.UUID | None = None,
    ) -> bool:
        stmt = select(Booking.id).where(
            Booking.venue_id == venue_id,
            Booking.customer_id == customer_id,
            Booking.start_date == start_date,
            Booking.booking_status.in_(ACTIVE_BOOKING_STATUSES),
            *self._not_deleted(),
        )
        if exclude_id:
            stmt = stmt.where(Booking.id != exclude_id)
        existing = (await self.db.execute(stmt)).scalars().all()
        if not existing:
            return False
        if not slot_ids:
            return bool(existing)
        slot_result = await self.db.execute(
            select(BookingSlot.booking_id).where(
                BookingSlot.booking_id.in_(existing),
                BookingSlot.venue_slot_id.in_(slot_ids),
            )
        )
        return slot_result.first() is not None

    async def count_for_venue(
        self, venue_id: uuid.UUID, *, include_deleted: bool = False
    ) -> int:
        stmt = select(func.count()).select_from(Booking).where(Booking.venue_id == venue_id)
        if not include_deleted:
            stmt = stmt.where(*self._not_deleted())
        return int((await self.db.execute(stmt)).scalar_one() or 0)


def new_day(booking_id: uuid.UUID, event_date: date, status: str = "booked") -> BookingDay:
    return BookingDay(
        id=uuid.uuid4(), booking_id=booking_id, event_date=event_date, status=status
    )
