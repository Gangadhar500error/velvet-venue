import math
import uuid
from datetime import date, datetime

from fastapi import HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import RoleName
from app.models.user import User
from app.models.venue_owner import (
    VenueOwner,
    VenueOwnerRegistrationSource,
    VenueOwnerStatus,
)
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.repositories.business_profile_repository import BusinessProfileRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.venue_repository import VenueRepository
from app.schemas.venue_owner import (
    BookingSummary,
    VenueOwnerCreateRequest,
    VenueOwnerDetailResponse,
    VenueOwnerListItem,
    VenueOwnerListResponse,
    VenueOwnerMutationResponse,
    VenueOwnerOverview,
    VenueOwnerUpdateRequest,
    MessageResponse,
    BusinessProfileSummary,
    VenueSummary,
    _initials,
    _split_name,
)
from app.services.permission_service import DataScope, PermissionService


class VenueOwnerService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = VenueOwnerRepository(db)
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)
        self.permissions = PermissionService(db)
        self.business_profiles = BusinessProfileRepository(db)
        self.venues_repo = VenueRepository(db)
        self.bookings = BookingRepository(db)

    def _assert_access(self, actor: User, owner: VenueOwner) -> None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return
        if scope == DataScope.VENDOR_OWNED:
            if owner.user_id != actor.id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="You can only access your own venue owner profile.",
                )
            return
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access venue owners.",
        )

    def _scoped_user_id(self, actor: User) -> uuid.UUID | None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.VENDOR_OWNED:
            return actor.id
        if scope == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot access venue owners.",
            )
        return None

    async def _compute_overview(self, owner: VenueOwner) -> VenueOwnerOverview:
        bp_count = await self.business_profiles.count_by_venue_owner(owner.id)
        venues_count = await self.venues_repo.count_by_venue_owner(owner.id)
        return VenueOwnerOverview(
            business_profiles_count=bp_count,
            venues_count=venues_count,
            total_bookings=0,
            revenue=0.0,
            pending_payments=0.0,
            completed_events=0,
            upcoming_events=0,
            verification_status=owner.verification_status,
        )

    def _to_list_item(
        self, owner: VenueOwner, business_profiles_count: int = 0, venues_count: int = 0
    ) -> VenueOwnerListItem:
        return VenueOwnerListItem(
            id=owner.id,
            owner_code=owner.owner_code,
            first_name=owner.first_name,
            last_name=owner.last_name,
            full_name=owner.full_name,
            email=owner.email,
            mobile=owner.mobile,
            business_name=owner.business_name,
            business_type=owner.business_type,
            city=owner.city,
            country=owner.country,
            status=owner.status,
            verification_status=owner.verification_status,
            registration_source=owner.registration_source,
            profile_image=owner.profile_image,
            created_at=owner.created_at,
            business_profiles_count=business_profiles_count,
            venues_count=venues_count,
            bookings_count=0,
            revenue=0.0,
            initials=_initials(owner.full_name),
        )

    async def _to_detail(
        self, owner: VenueOwner, *, existed: bool = False
    ) -> VenueOwnerDetailResponse:
        overview = await self._compute_overview(owner)
        profiles = await self.business_profiles.list_by_venue_owner(owner.id, limit=50)
        venues = await self.venues_repo.list_by_venue_owner(owner.id, limit=50)
        return VenueOwnerDetailResponse(
            id=owner.id,
            owner_code=owner.owner_code,
            user_id=owner.user_id,
            first_name=owner.first_name,
            last_name=owner.last_name,
            full_name=owner.full_name,
            email=owner.email,
            mobile=owner.mobile,
            alternate_mobile=owner.alternate_mobile,
            gender=owner.gender,
            date_of_birth=owner.date_of_birth,
            profile_image=owner.profile_image,
            business_name=owner.business_name,
            business_type=owner.business_type,
            registration_source=owner.registration_source,
            verification_status=owner.verification_status,
            status=owner.status,
            address_line1=owner.address_line1,
            address_line2=owner.address_line2,
            city=owner.city,
            state=owner.state,
            country=owner.country,
            postal_code=owner.postal_code,
            gst_number=owner.gst_number,
            pan_number=owner.pan_number,
            business_registration_number=owner.business_registration_number,
            website=owner.website,
            description=owner.description,
            member_since=owner.created_at,
            created_at=owner.created_at,
            updated_at=owner.updated_at,
            created_by=owner.created_by,
            updated_by=owner.updated_by,
            initials=_initials(owner.full_name),
            overview=overview,
            business_profiles=[
                BusinessProfileSummary(
                    id=p.id,
                    business_name=p.business_name,
                    business_type=p.business_type,
                    city=p.city,
                    status=p.status,
                )
                for p in profiles
            ],
            venues=[
                VenueSummary(
                    id=v.id,
                    name=v.venue_name,
                    venue_type=v.venue_type,
                    capacity=v.seating_capacity,
                    city=v.city,
                    status=v.venue_status,
                )
                for v in venues
            ],
            recent_bookings=[
                BookingSummary(
                    id=b.id,
                    booking_code=b.booking_number,
                    customer_name=b.customer.full_name if b.customer else "",
                    venue_name=b.venue.venue_name if b.venue else "",
                    event_date=b.start_date,
                    amount=float(b.total_amount),
                    status=(
                        "cancelled"
                        if b.booking_status in {"cancelled", "rejected"}
                        else "completed"
                        if b.booking_status in {"completed", "refunded"}
                        else "pending"
                        if b.booking_status == "pending"
                        else "upcoming"
                    ),
                )
                for b in await self.bookings.list_recent_for_vendor(owner.id)
            ],
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
        status: str = "pending",
    ) -> tuple[User, bool]:
        existing = await self.users.get_by_email_or_mobile(email=email, mobile=mobile)
        if existing:
            # Ensure vendor role if they are being onboarded as venue owner
            vendor_role = await self.roles.get_or_create(RoleName.VENDOR)
            if existing.role_id != vendor_role.id and existing.role.name == RoleName.CUSTOMER:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="A customer account already exists with this email or mobile.",
                )
            if existing.role.name != RoleName.VENDOR and existing.role.name != RoleName.ADMIN:
                existing.role_id = vendor_role.id
            existing.first_name = first_name or existing.first_name
            existing.last_name = last_name if last_name is not None else existing.last_name
            existing.email = email
            existing.mobile = mobile
            existing.phone = mobile
            user_status = "active" if status == "active" else "inactive"
            if existing.status == "active" and status != "active":
                existing.status = user_status
            existing.sync_derived_flags()
            await self.db.flush()
            await self.db.refresh(existing, attribute_names=["role"])
            return existing, False

        role = await self.roles.get_or_create(RoleName.VENDOR)
        user_status = "active" if status == "active" else "inactive"
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
            email_verified=False,
            mobile_verified=False,
            status=user_status,
            is_active=user_status == "active",
            is_verified=False,
        )
        created = await self.users.create(user)
        return created, True

    async def _sync_user_from_owner(self, owner: VenueOwner) -> None:
        user = await self.users.get_by_id(owner.user_id)
        if user is None:
            return
        user.first_name = owner.first_name
        user.last_name = owner.last_name
        user.full_name = owner.full_name
        user.email = owner.email
        user.mobile = owner.mobile
        user.phone = owner.mobile
        if owner.status == VenueOwnerStatus.DELETED.value:
            user.status = "inactive"
            user.is_active = False
        elif owner.status == "active":
            user.status = "active"
            user.is_active = True
        elif owner.status in {"inactive", "pending"}:
            user.status = "inactive"
            user.is_active = False
        user.sync_derived_flags()
        await self.db.flush()

    async def list_owners(
        self,
        actor: User,
        *,
        search: str | None = None,
        status_filter: str | None = None,
        registration_source: str | None = None,
        verification_status: str | None = None,
        city: str | None = None,
        business_type: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sort_by: str = "name",
        sort_dir: str = "asc",
        page: int = 1,
        page_size: int = 10,
    ) -> VenueOwnerListResponse:
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
        rows, total = await self.repo.list_owners(
            search=search,
            status=status_filter,
            registration_source=registration_source,
            verification_status=verification_status,
            city=city,
            business_type=business_type,
            date_from=date_from_dt,
            date_to=date_to_dt,
            sort_by=sort_by,
            sort_dir=sort_dir,
            page=page,
            page_size=page_size,
            user_id=self._scoped_user_id(actor),
        )
        items = []
        for owner in rows:
            bp_count = await self.business_profiles.count_by_venue_owner(owner.id)
            venues_count = await self.venues_repo.count_by_venue_owner(owner.id)
            items.append(
                self._to_list_item(
                    owner,
                    business_profiles_count=bp_count,
                    venues_count=venues_count,
                )
            )
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return VenueOwnerListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_owner(
        self, actor: User, owner_id: uuid.UUID
    ) -> VenueOwnerDetailResponse:
        owner = await self.repo.get_by_id(owner_id)
        if owner is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue owner not found."
            )
        self._assert_access(actor, owner)
        return await self._to_detail(owner)

    async def get_my_profile(self, actor: User) -> VenueOwnerDetailResponse:
        owner = await self.repo.get_by_user_id(actor.id)
        if owner is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Venue owner profile not found.",
            )
        return await self._to_detail(owner)

    async def create_owner(
        self, actor: User, payload: VenueOwnerCreateRequest
    ) -> VenueOwnerMutationResponse:
        existing = await self.repo.find_by_email_or_mobile(
            email=payload.email, mobile=payload.mobile
        )
        if existing:
            self._assert_access(actor, existing)
            if payload.return_existing:
                return VenueOwnerMutationResponse(
                    message="Existing venue owner returned.",
                    venue_owner=await self._to_detail(existing, existed=True),
                    existed=True,
                )
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Venue owner with this email or mobile already exists.",
            )

        first = payload.first_name or ""
        last = payload.last_name or ""
        full_name = f"{first} {last}".strip()
        source = payload.registration_source

        user, _ = await self._resolve_or_create_user(
            actor=actor,
            first_name=first,
            last_name=last,
            email=payload.email,
            mobile=payload.mobile,
            status=payload.status,
        )

        linked = await self.repo.get_by_user_id_any(user.id)
        if linked:
            if linked.deleted_at is None and linked.status != VenueOwnerStatus.DELETED.value:
                if payload.return_existing:
                    return VenueOwnerMutationResponse(
                        message="Existing venue owner returned.",
                        venue_owner=await self._to_detail(linked, existed=True),
                        existed=True,
                    )
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Venue owner profile already exists for this user.",
                )
            # Soft-deleted profile: restore and apply the new form values
            restored = await self._restore_owner(linked, payload, actor=actor)
            await self.db.commit()
            await self.db.refresh(restored)
            return VenueOwnerMutationResponse(
                message="Venue owner restored successfully.",
                venue_owner=await self._to_detail(restored),
                existed=False,
            )

        # Soft-deleted by email/mobile but not linked to this user (edge case)
        soft = await self.repo.find_by_email_any(payload.email) or await self.repo.find_by_mobile_any(
            payload.mobile
        )
        if soft and (soft.deleted_at is not None or soft.status == VenueOwnerStatus.DELETED.value):
            soft.user_id = user.id
            restored = await self._restore_owner(soft, payload, actor=actor)
            await self.db.commit()
            await self.db.refresh(restored)
            return VenueOwnerMutationResponse(
                message="Venue owner restored successfully.",
                venue_owner=await self._to_detail(restored),
                existed=False,
            )

        owner = VenueOwner(
            tenant_id=user.tenant_id,
            user_id=user.id,
            owner_code=await self.repo.next_owner_code(),
            first_name=first,
            last_name=last,
            full_name=full_name,
            email=payload.email,
            mobile=payload.mobile,
            alternate_mobile=payload.alternate_mobile,
            gender=payload.gender,
            date_of_birth=payload.date_of_birth,
            profile_image=payload.profile_image,
            business_name=payload.business_name,
            business_type=payload.business_type,
            registration_source=source,
            verification_status=payload.verification_status,
            status=payload.status,
            address_line1=payload.address_line1,
            address_line2=payload.address_line2,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            postal_code=payload.postal_code,
            gst_number=payload.gst_number,
            pan_number=payload.pan_number,
            business_registration_number=payload.business_registration_number,
            website=payload.website,
            description=payload.description,
            created_by=actor.id,
            updated_by=actor.id,
        )
        try:
            owner = await self.repo.create(owner)
            await self.db.commit()
            await self.db.refresh(owner)
        except Exception as exc:
            await self.db.rollback()
            # Surface unique conflicts as 409 instead of opaque 500 / failed fetch
            if "uq_venue_owners_user_id" in str(exc) or "UniqueViolation" in type(exc).__name__:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Venue owner profile already exists for this email or mobile.",
                ) from exc
            raise
        return VenueOwnerMutationResponse(
            message="Venue owner created successfully.",
            venue_owner=await self._to_detail(owner),
            existed=False,
        )

    async def _restore_owner(
        self,
        owner: VenueOwner,
        payload: VenueOwnerCreateRequest,
        *,
        actor: User,
    ) -> VenueOwner:
        first = payload.first_name or owner.first_name
        last = payload.last_name if payload.last_name is not None else owner.last_name
        owner.deleted_at = None
        owner.first_name = first
        owner.last_name = last or ""
        owner.full_name = f"{first} {last or ''}".strip()
        owner.email = payload.email
        owner.mobile = payload.mobile
        owner.alternate_mobile = payload.alternate_mobile
        owner.gender = payload.gender
        owner.date_of_birth = payload.date_of_birth
        owner.profile_image = payload.profile_image
        owner.business_name = payload.business_name
        owner.business_type = payload.business_type
        owner.registration_source = payload.registration_source
        owner.verification_status = payload.verification_status
        owner.status = payload.status if payload.status != "deleted" else "pending"
        owner.address_line1 = payload.address_line1
        owner.address_line2 = payload.address_line2
        owner.city = payload.city
        owner.state = payload.state
        owner.country = payload.country
        owner.postal_code = payload.postal_code
        owner.gst_number = payload.gst_number
        owner.pan_number = payload.pan_number
        owner.business_registration_number = payload.business_registration_number
        owner.website = payload.website
        owner.description = payload.description
        owner.updated_by = actor.id
        await self._sync_user_from_owner(owner)
        await self.db.flush()
        return owner

    async def update_owner(
        self, actor: User, owner_id: uuid.UUID, payload: VenueOwnerUpdateRequest
    ) -> VenueOwnerMutationResponse:
        owner = await self.repo.get_by_id(owner_id)
        if owner is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue owner not found."
            )
        self._assert_access(actor, owner)

        data = payload.model_dump(exclude_unset=True)
        if "name" in data and data["name"]:
            first, last = _split_name(data.pop("name"))
            data["first_name"] = first
            data["last_name"] = last

        if "email" in data and data["email"]:
            other = await self.repo.find_by_email(data["email"])
            if other and other.id != owner.id:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Another venue owner already uses this email.",
                )
            other_user = await self.users.get_by_email(data["email"])
            if other_user and other_user.id != owner.user_id:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Another user already uses this email.",
                )
        if "mobile" in data and data["mobile"]:
            other = await self.repo.find_by_mobile(data["mobile"])
            if other and other.id != owner.id:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Another venue owner already uses this mobile number.",
                )
            other_user = await self.users.get_by_mobile(data["mobile"])
            if other_user and other_user.id != owner.user_id:
                raise HTTPException(
                    status_code=http_status.HTTP_409_CONFLICT,
                    detail="Another user already uses this mobile number.",
                )

        for key, value in data.items():
            setattr(owner, key, value)
        if "first_name" in data or "last_name" in data:
            owner.full_name = f"{owner.first_name} {owner.last_name}".strip()
        owner.updated_by = actor.id
        await self._sync_user_from_owner(owner)
        await self.db.commit()
        await self.db.refresh(owner)
        return VenueOwnerMutationResponse(
            message="Venue owner updated successfully.",
            venue_owner=await self._to_detail(owner),
        )

    async def delete_owner(
        self, actor: User, owner_id: uuid.UUID
    ) -> MessageResponse:
        if self.permissions.get_data_scope(actor) != DataScope.ALL:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Only admins can delete venue owners.",
            )
        owner = await self.repo.get_by_id(owner_id)
        if owner is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue owner not found."
            )
        await self.repo.soft_delete(owner, updated_by=actor.id)
        user = await self.users.get_by_id(owner.user_id)
        if user:
            user.status = "inactive"
            user.is_active = False
            user.sync_derived_flags()
            await self.db.flush()
        await self.db.commit()
        return MessageResponse(message="Venue owner deleted successfully.")

    async def ensure_owner_for_user(
        self,
        user: User,
        *,
        registration_source: str = VenueOwnerRegistrationSource.WEBSITE.value,
        business_name: str | None = None,
    ) -> VenueOwner:
        any_existing = await self.repo.get_by_user_id_any(user.id)
        if any_existing:
            if any_existing.deleted_at is not None or any_existing.status == "deleted":
                any_existing.deleted_at = None
                if any_existing.status == "deleted":
                    any_existing.status = "pending"
                await self.db.flush()
            return any_existing

        by_email = await self.repo.find_by_email(user.email)
        if by_email:
            by_email.user_id = user.id
            await self.db.flush()
            return by_email

        mobile = user.mobile or user.phone or f"pending-{str(user.id)[:8]}"
        owner = VenueOwner(
            tenant_id=user.tenant_id,
            user_id=user.id,
            owner_code=await self.repo.next_owner_code(),
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name or f"{user.first_name} {user.last_name}".strip(),
            email=user.email,
            mobile=mobile,
            business_name=business_name,
            registration_source=registration_source,
            verification_status="pending",
            status="pending",
            created_by=user.id,
            updated_by=user.id,
        )
        return await self.repo.create(owner)

    async def list_cities(self, actor: User) -> list[str]:
        _ = actor
        return await self.repo.distinct_cities()
