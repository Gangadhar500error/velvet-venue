import math
import uuid
from datetime import date, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import (
    Customer,
    CustomerStatus,
    RegistrationSource,
    VerificationStatus,
)
from app.models.role import RoleName
from app.models.user import User
from app.repositories.customer_repository import CustomerRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.repositories.booking_repository import BookingRepository
from app.schemas.customer import (
    CustomerBookingSummary,
    CustomerCreateRequest,
    CustomerDetailResponse,
    CustomerInvoiceSummary,
    CustomerListItem,
    CustomerListResponse,
    CustomerMutationResponse,
    CustomerSearchItem,
    CustomerSearchResponse,
    CustomerOverview,
    CustomerUpdateRequest,
    FindOrCreateCustomerRequest,
    MessageResponse,
    _initials,
    _split_name,
)
from app.services.permission_service import DataScope, PermissionService


class CustomerService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CustomerRepository(db)
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)
        self.bookings = BookingRepository(db)
        self.permissions = PermissionService(db)

    def _assert_access(self, actor: User, customer: Customer) -> None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return
        if scope == DataScope.CUSTOMER_OWNED:
            if customer.user_id != actor.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only access your own customer profile.",
                )
            return
        return

    def _scoped_user_id(self, actor: User) -> uuid.UUID | None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.CUSTOMER_OWNED:
            return actor.id
        return None

    async def _compute_overview(self, customer_id: uuid.UUID) -> CustomerOverview:
        _rows, total = await self.bookings.list_bookings(
            customer_id=customer_id, page=1, page_size=1
        )
        recent = await self.bookings.list_recent_for_customer(customer_id, limit=50)
        spend = sum(float(b.paid_amount or 0) for b in recent)
        pending = sum(float(b.remaining_amount or 0) for b in recent)
        last = recent[0].start_date if recent else None
        upcoming = sum(
            1 for b in recent if b.booking_status in {"pending", "confirmed", "checked_in"}
        )
        completed = sum(1 for b in recent if b.booking_status == "completed")
        cancelled = sum(1 for b in recent if b.booking_status in {"cancelled", "rejected"})
        return CustomerOverview(
            total_bookings=total,
            upcoming_bookings=upcoming,
            completed_bookings=completed,
            cancelled_bookings=cancelled,
            lifetime_spend=spend,
            total_paid=spend,
            pending_amount=pending,
            last_booking_date=last,
            average_booking=(spend / total) if total else 0.0,
        )

    def _to_list_item(self, customer: Customer) -> CustomerListItem:
        return CustomerListItem(
            id=customer.id,
            customer_code=customer.customer_code,
            first_name=customer.first_name,
            last_name=customer.last_name,
            full_name=customer.full_name,
            email=customer.email,
            mobile=customer.mobile,
            city=customer.city,
            country=customer.country,
            status=customer.status,
            verification_status=customer.verification_status,
            email_verified=customer.email_verified,
            mobile_verified=customer.mobile_verified,
            registration_source=customer.registration_source,
            customer_type=customer.customer_type,
            profile_image=customer.profile_image,
            created_at=customer.created_at,
            bookings=0,
            lifetime_spend=0.0,
            last_booking_date=None,
            initials=_initials(customer.full_name),
        )

    async def _to_detail(
        self, customer: Customer, *, existed: bool = False
    ) -> CustomerDetailResponse:
        overview = await self._compute_overview(customer.id)
        return CustomerDetailResponse(
            id=customer.id,
            customer_code=customer.customer_code,
            first_name=customer.first_name,
            last_name=customer.last_name,
            full_name=customer.full_name,
            email=customer.email,
            mobile=customer.mobile,
            alternate_mobile=customer.alternate_mobile,
            gender=customer.gender,
            date_of_birth=customer.date_of_birth,
            profile_image=customer.profile_image,
            registration_source=customer.registration_source,
            customer_type=customer.customer_type,
            email_verified=customer.email_verified,
            mobile_verified=customer.mobile_verified,
            verification_status=customer.verification_status,
            status=customer.status,
            address_line1=customer.address_line1,
            address_line2=customer.address_line2,
            city=customer.city,
            state=customer.state,
            country=customer.country,
            postal_code=customer.postal_code,
            notes=customer.notes,
            communication_preference=customer.communication_preference,
            member_since=customer.created_at,
            created_at=customer.created_at,
            updated_at=customer.updated_at,
            created_by=customer.created_by,
            updated_by=customer.updated_by,
            user_id=customer.user_id,
            initials=_initials(customer.full_name),
            overview=overview,
            recent_bookings=[
                CustomerBookingSummary(
                    id=b.id,
                    booking_code=b.booking_number,
                    venue_name=b.venue.venue_name if b.venue else "",
                    event_type=b.event_type or "",
                    booking_date=b.booking_date,
                    event_date=b.start_date,
                    guests=b.guest_count,
                    amount=float(b.total_amount),
                    payment_status=(
                        "paid"
                        if b.payment_status == "paid"
                        else "refunded"
                        if b.payment_status == "refunded"
                        else "failed"
                        if b.payment_status == "failed"
                        else "pending"
                    ),
                    booking_status=(
                        "cancelled"
                        if b.booking_status in {"cancelled", "rejected"}
                        else "completed"
                        if b.booking_status in {"completed", "refunded"}
                        else "upcoming"
                    ),
                )
                for b in await self.bookings.list_recent_for_customer(customer.id)
            ],
            recent_invoices=[
                CustomerInvoiceSummary(
                    id=i.id,
                    invoice_number=i.invoice_number,
                    amount=float(i.amount),
                    status=i.invoice_status,
                    issued_at=i.issued_at,
                )
                for i in await self.bookings.list_recent_invoices_for_customer(customer.id)
            ],
            reviews=[],
            existed=existed,
        )

    async def _resolve_or_create_user(
        self,
        *,
        actor: User,
        first_name: str,
        last_name: str,
        email: str,
        mobile: str,
        email_verified: bool = False,
        mobile_verified: bool = False,
        status: str = "active",
    ) -> tuple[User, bool]:
        existing = await self.users.get_by_email_or_mobile(email=email, mobile=mobile)
        if existing:
            existing.first_name = first_name or existing.first_name
            existing.last_name = last_name if last_name is not None else existing.last_name
            existing.email = email
            existing.mobile = mobile
            existing.phone = mobile
            existing.email_verified = existing.email_verified or email_verified
            existing.mobile_verified = existing.mobile_verified or mobile_verified
            if status and existing.status == "active":
                existing.status = status if status != "deleted" else "inactive"
            existing.sync_derived_flags()
            await self.db.flush()
            return existing, False

        role = await self.roles.get_or_create(RoleName.CUSTOMER)
        user_status = "inactive" if status in {"deleted", "blocked"} else (
            "inactive" if status == "pending" else status
        )
        user = User(
            tenant_id=getattr(actor, "tenant_id", None),
            role_id=role.id,
            email=email.lower().strip(),
            password_hash=UserRepository.unusable_password_hash(),
            first_name=first_name,
            last_name=last_name,
            full_name=f"{first_name} {last_name}".strip(),
            phone=mobile,
            mobile=mobile,
            email_verified=email_verified,
            mobile_verified=mobile_verified,
            status=user_status,
            is_active=user_status == "active",
            is_verified=email_verified,
        )
        created = await self.users.create(user)
        return created, True

    async def _sync_user_from_customer(self, customer: Customer) -> None:
        if not customer.user_id:
            return
        user = await self.users.get_by_id(customer.user_id)
        if user is None:
            return
        user.first_name = customer.first_name
        user.last_name = customer.last_name
        user.full_name = customer.full_name
        user.email = customer.email
        user.mobile = customer.mobile
        user.phone = customer.mobile
        user.email_verified = customer.email_verified
        user.mobile_verified = customer.mobile_verified
        if customer.status == CustomerStatus.DELETED.value:
            user.status = "inactive"
            user.is_active = False
        elif customer.status == "blocked":
            user.status = "blocked"
            user.is_active = False
        elif customer.status == "pending":
            user.status = "inactive"
            user.is_active = False
        elif customer.status in {"active", "inactive"}:
            user.status = customer.status
            user.is_active = customer.status == "active"
        user.sync_derived_flags()
        await self.db.flush()

    async def list_customers(
        self,
        actor: User,
        *,
        search: str | None = None,
        status_filter: str | None = None,
        registration_source: str | None = None,
        verification_status: str | None = None,
        city: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sort_by: str = "name",
        sort_dir: str = "asc",
        page: int = 1,
        page_size: int = 10,
    ) -> CustomerListResponse:
        date_from_dt = (
            datetime.combine(date_from, datetime.min.time()).astimezone()
            if date_from
            else None
        )
        date_to_dt = (
            datetime.combine(date_to, datetime.max.time()).astimezone()
            if date_to
            else None
        )

        rows, total = await self.repo.list_customers(
            search=search,
            status=status_filter,
            registration_source=registration_source,
            verification_status=verification_status,
            city=city,
            date_from=date_from_dt,
            date_to=date_to_dt,
            sort_by=sort_by,
            sort_dir=sort_dir,
            page=page,
            page_size=page_size,
            user_id=self._scoped_user_id(actor),
        )
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return CustomerListResponse(
            items=[self._to_list_item(c) for c in rows],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def _to_search_item(self, customer: Customer) -> CustomerSearchItem:
        address = ", ".join(
            part
            for part in (
                customer.address_line1,
                customer.address_line2,
                customer.city,
                customer.state,
            )
            if part
        )
        user = customer.user
        return CustomerSearchItem(
            id=customer.id,
            customer_code=customer.customer_code,
            first_name=customer.first_name,
            last_name=customer.last_name,
            full_name=customer.full_name,
            phone=customer.mobile,
            email=customer.email,
            address=address or None,
            city=customer.city,
            state=customer.state,
            profile_photo=customer.profile_image,
            is_verified=bool(user.is_verified) if user else customer.verification_status == "verified",
            is_active=bool(user.is_active) if user else customer.status == "active",
        )

    async def search_customers(
        self,
        actor: User,
        *,
        query: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> CustomerSearchResponse:
        if self.permissions.get_data_scope(actor) == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers cannot search the booking customer directory.",
            )
        rows, total = await self.repo.search_customers(
            query=query,
            user_id=None,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return CustomerSearchResponse(
            items=[self._to_search_item(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_customer(
        self, actor: User, customer_id: uuid.UUID
    ) -> CustomerDetailResponse:
        customer = await self.repo.get_by_id(customer_id)
        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found."
            )
        self._assert_access(actor, customer)
        return await self._to_detail(customer)

    async def get_my_profile(self, actor: User) -> CustomerDetailResponse:
        customer = await self.repo.get_by_user_id(actor.id)
        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer profile not found.",
            )
        return await self._to_detail(customer)

    async def create_customer(
        self, actor: User, payload: CustomerCreateRequest
    ) -> CustomerMutationResponse:
        existing = await self.repo.find_by_email_or_mobile(
            email=payload.email, mobile=payload.mobile
        )
        if existing:
            if existing.user_id is None:
                user, _ = await self._resolve_or_create_user(
                    actor=actor,
                    first_name=existing.first_name,
                    last_name=existing.last_name,
                    email=existing.email,
                    mobile=existing.mobile,
                    email_verified=existing.email_verified,
                    mobile_verified=existing.mobile_verified,
                    status=existing.status,
                )
                existing.user_id = user.id
                await self.db.flush()
                await self.db.commit()
                await self.db.refresh(existing)
            self._assert_access(actor, existing)
            detail = await self._to_detail(existing, existed=True)
            if payload.return_existing:
                return CustomerMutationResponse(
                    message="Existing customer returned.",
                    customer=detail,
                    existed=True,
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Customer with this email or mobile already exists.",
            )

        source = payload.registration_source
        if actor.role.name == RoleName.VENDOR and source == "admin":
            source = RegistrationSource.VENDOR.value

        first = payload.first_name or ""
        last = payload.last_name or ""
        full_name = f"{first} {last}".strip()
        mobile = payload.mobile or payload.phone or ""
        if not mobile:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="mobile or phone is required.",
            )

        user, _created_user = await self._resolve_or_create_user(
            actor=actor,
            first_name=first,
            last_name=last,
            email=payload.email,
            mobile=mobile,
            email_verified=payload.email_verified,
            mobile_verified=payload.mobile_verified,
            status=payload.status if payload.status != "deleted" else "inactive",
        )

        linked = await self.repo.get_by_user_id(user.id)
        if linked:
            self._assert_access(actor, linked)
            if payload.return_existing:
                return CustomerMutationResponse(
                    message="Existing customer returned.",
                    customer=await self._to_detail(linked, existed=True),
                    existed=True,
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Customer profile already exists for this user.",
            )

        customer = Customer(
            tenant_id=user.tenant_id,
            user_id=user.id,
            customer_code=await self.repo.next_customer_code(),
            first_name=first,
            last_name=last,
            full_name=full_name,
            email=payload.email,
            mobile=mobile,
            alternate_mobile=payload.alternate_mobile,
            gender=payload.gender,
            date_of_birth=payload.date_of_birth,
            profile_image=payload.profile_image,
            registration_source=source,
            customer_type=payload.customer_type,
            email_verified=payload.email_verified,
            mobile_verified=payload.mobile_verified,
            verification_status=payload.verification_status,
            status=payload.status,
            address_line1=payload.address_line1,
            address_line2=payload.address_line2,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            postal_code=payload.postal_code,
            notes=payload.notes,
            communication_preference=payload.communication_preference,
            created_by=actor.id,
            updated_by=actor.id,
        )
        customer = await self.repo.create(customer)
        await self.db.commit()
        await self.db.refresh(customer)
        return CustomerMutationResponse(
            message="Customer created successfully.",
            customer=await self._to_detail(customer),
            existed=False,
        )

    async def update_customer(
        self, actor: User, customer_id: uuid.UUID, payload: CustomerUpdateRequest
    ) -> CustomerMutationResponse:
        customer = await self.repo.get_by_id(customer_id)
        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found."
            )
        self._assert_access(actor, customer)

        data = payload.model_dump(exclude_unset=True)
        if "name" in data and data["name"]:
            first, last = _split_name(data.pop("name"))
            data["first_name"] = first
            data["last_name"] = last

        if "email" in data and data["email"]:
            other = await self.repo.find_by_email(data["email"])
            if other and other.id != customer.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Another customer already uses this email.",
                )
            other_user = await self.users.get_by_email(data["email"])
            if other_user and other_user.id != customer.user_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Another user already uses this email.",
                )
        if "mobile" in data and data["mobile"]:
            other = await self.repo.find_by_mobile(data["mobile"])
            if other and other.id != customer.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Another customer already uses this mobile number.",
                )
            other_user = await self.users.get_by_mobile(data["mobile"])
            if other_user and other_user.id != customer.user_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Another user already uses this mobile number.",
                )

        for key, value in data.items():
            setattr(customer, key, value)

        if "first_name" in data or "last_name" in data:
            customer.full_name = f"{customer.first_name} {customer.last_name}".strip()

        customer.updated_by = actor.id

        if customer.user_id is None:
            user, _ = await self._resolve_or_create_user(
                actor=actor,
                first_name=customer.first_name,
                last_name=customer.last_name,
                email=customer.email,
                mobile=customer.mobile,
                email_verified=customer.email_verified,
                mobile_verified=customer.mobile_verified,
                status=customer.status,
            )
            customer.user_id = user.id
        else:
            await self._sync_user_from_customer(customer)

        await self.db.commit()
        await self.db.refresh(customer)
        return CustomerMutationResponse(
            message="Customer updated successfully.",
            customer=await self._to_detail(customer),
        )

    async def delete_customer(
        self, actor: User, customer_id: uuid.UUID
    ) -> MessageResponse:
        if self.permissions.get_data_scope(actor) == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers cannot delete their account via this endpoint.",
            )
        customer = await self.repo.get_by_id(customer_id)
        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found."
            )
        self._assert_access(actor, customer)
        await self.repo.soft_delete(customer, updated_by=actor.id)
        if customer.user_id:
            user = await self.users.get_by_id(customer.user_id)
            if user:
                user.status = "inactive"
                user.is_active = False
                user.sync_derived_flags()
                await self.db.flush()
        await self.db.commit()
        return MessageResponse(message="Customer deleted successfully.")

    async def find_or_create(
        self, actor: User, payload: FindOrCreateCustomerRequest
    ) -> CustomerMutationResponse:
        existing = await self.repo.find_by_email_or_mobile(
            email=payload.email, mobile=payload.mobile
        )
        if existing:
            if existing.user_id is None and payload.email:
                user, _ = await self._resolve_or_create_user(
                    actor=actor,
                    first_name=existing.first_name,
                    last_name=existing.last_name,
                    email=existing.email,
                    mobile=existing.mobile,
                    email_verified=existing.email_verified,
                    mobile_verified=existing.mobile_verified,
                    status=existing.status,
                )
                existing.user_id = user.id
                await self.db.commit()
                await self.db.refresh(existing)
            return CustomerMutationResponse(
                message="Existing customer returned.",
                customer=await self._to_detail(existing, existed=True),
                existed=True,
            )

        if payload.email or payload.mobile:
            user = await self.users.get_by_email_or_mobile(
                email=payload.email, mobile=payload.mobile
            )
            if user:
                linked = await self.repo.get_by_user_id(user.id)
                if linked:
                    return CustomerMutationResponse(
                        message="Existing customer returned.",
                        customer=await self._to_detail(linked, existed=True),
                        existed=True,
                    )

        if not payload.email or not payload.mobile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both email and mobile are required to create a new customer.",
            )

        create_payload = CustomerCreateRequest(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            mobile=payload.mobile,
            registration_source=payload.registration_source,
            return_existing=True,
        )
        return await self.create_customer(actor, create_payload)

    async def ensure_customer_for_user(
        self,
        user: User,
        *,
        registration_source: str = RegistrationSource.WEBSITE.value,
    ) -> Customer:
        existing = await self.repo.get_by_user_id(user.id)
        if existing:
            return existing

        by_email = await self.repo.find_by_email(user.email)
        if by_email:
            by_email.user_id = user.id
            by_email.first_name = user.first_name
            by_email.last_name = user.last_name
            by_email.full_name = (
                user.full_name or f"{user.first_name} {user.last_name}".strip()
            )
            if user.mobile or user.phone:
                by_email.mobile = user.mobile or user.phone or by_email.mobile
            await self.db.flush()
            return by_email

        mobile = user.mobile or user.phone or f"pending-{str(user.id)[:8]}"
        customer = Customer(
            tenant_id=user.tenant_id,
            user_id=user.id,
            customer_code=await self.repo.next_customer_code(),
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name or f"{user.first_name} {user.last_name}".strip(),
            email=user.email,
            mobile=mobile,
            registration_source=registration_source,
            customer_type="individual",
            email_verified=user.email_verified or user.is_verified,
            mobile_verified=user.mobile_verified,
            verification_status=(
                VerificationStatus.VERIFIED.value
                if (user.email_verified or user.is_verified)
                else VerificationStatus.PENDING.value
            ),
            status=(
                CustomerStatus.ACTIVE.value
                if user.status == "active"
                else CustomerStatus.INACTIVE.value
            ),
            created_by=user.id,
            updated_by=user.id,
        )
        return await self.repo.create(customer)

    async def list_cities(self, actor: User) -> list[str]:
        _ = actor
        return await self.repo.distinct_cities()
