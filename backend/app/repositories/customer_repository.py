import uuid
from datetime import UTC, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer, CustomerStatus


class CustomerRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _not_deleted(self) -> list:
        return [
            Customer.deleted_at.is_(None),
            Customer.status != CustomerStatus.DELETED.value,
        ]

    async def get_by_id(self, customer_id: uuid.UUID) -> Customer | None:
        result = await self.db.execute(
            select(Customer).where(Customer.id == customer_id, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, customer_code: str) -> Customer | None:
        result = await self.db.execute(
            select(Customer).where(
                Customer.customer_code == customer_code, *self._not_deleted()
            )
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> Customer | None:
        result = await self.db.execute(
            select(Customer).where(Customer.user_id == user_id, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def find_by_email(self, email: str) -> Customer | None:
        result = await self.db.execute(
            select(Customer).where(
                func.lower(Customer.email) == email.lower().strip(),
                *self._not_deleted(),
            )
        )
        return result.scalar_one_or_none()

    async def find_by_mobile(self, mobile: str) -> Customer | None:
        cleaned = "".join(ch for ch in mobile if ch.isdigit() or ch == "+")
        result = await self.db.execute(
            select(Customer).where(Customer.mobile == cleaned, *self._not_deleted())
        )
        return result.scalar_one_or_none()

    async def find_by_email_or_mobile(
        self, email: str | None = None, mobile: str | None = None
    ) -> Customer | None:
        if email:
            found = await self.find_by_email(email)
            if found:
                return found
        if mobile:
            return await self.find_by_mobile(mobile)
        return None

    async def next_customer_code(self) -> str:
        result = await self.db.execute(select(func.count()).select_from(Customer))
        count = int(result.scalar_one() or 0)
        return f"CUST-{100000 + count + 1}"

    async def create(self, customer: Customer) -> Customer:
        self.db.add(customer)
        await self.db.flush()
        await self.db.refresh(customer)
        return customer

    async def soft_delete(
        self, customer: Customer, updated_by: uuid.UUID | None = None
    ) -> Customer:
        customer.deleted_at = datetime.now(UTC)
        customer.status = CustomerStatus.DELETED.value
        customer.updated_by = updated_by
        await self.db.flush()
        return customer

    def build_list_query(
        self,
        *,
        search: str | None = None,
        status: str | None = None,
        registration_source: str | None = None,
        verification_status: str | None = None,
        city: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        user_id: uuid.UUID | None = None,
    ) -> Select:
        stmt = select(Customer).where(*self._not_deleted())

        if user_id is not None:
            stmt = stmt.where(Customer.user_id == user_id)

        if search:
            q = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Customer.full_name.ilike(q),
                    Customer.customer_code.ilike(q),
                    Customer.email.ilike(q),
                    Customer.mobile.ilike(q),
                )
            )
        if status:
            stmt = stmt.where(Customer.status == status)
        if registration_source:
            stmt = stmt.where(Customer.registration_source == registration_source)
        if verification_status:
            stmt = stmt.where(Customer.verification_status == verification_status)
        if city:
            stmt = stmt.where(Customer.city.ilike(city))
        if date_from:
            stmt = stmt.where(Customer.created_at >= date_from)
        if date_to:
            stmt = stmt.where(Customer.created_at <= date_to)

        return stmt

    async def list_customers(
        self,
        *,
        search: str | None = None,
        status: str | None = None,
        registration_source: str | None = None,
        verification_status: str | None = None,
        city: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sort_by: str = "name",
        sort_dir: str = "asc",
        page: int = 1,
        page_size: int = 10,
        user_id: uuid.UUID | None = None,
    ) -> tuple[list[Customer], int]:
        base = self.build_list_query(
            search=search,
            status=status,
            registration_source=registration_source,
            verification_status=verification_status,
            city=city,
            date_from=date_from,
            date_to=date_to,
            user_id=user_id,
        )

        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        sort_map = {
            "name": Customer.full_name,
            "registration_date": Customer.created_at,
            # bookings / lifetime_spend sort as name until booking tables exist
            "bookings": Customer.created_at,
            "lifetime_spend": Customer.created_at,
        }
        sort_col = sort_map.get(sort_by, Customer.full_name)
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
            select(Customer.city)
            .where(Customer.city.is_not(None), *self._not_deleted())
            .distinct()
            .order_by(Customer.city)
        )
        return [row[0] for row in result.all() if row[0]]
