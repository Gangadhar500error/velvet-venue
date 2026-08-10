import math
import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import HTTPException, UploadFile, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.storage import save_venue_upload_file
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.models.venue import (
    Venue,
    VenueAmenityMapping,
    VenueDocument,
    VenueEventMapping,
    VenueFoodSlot,
    VenueGalleryItem,
    VenuePricing,
    VenueServiceMapping,
    VenueSlot,
    VenueStatus,
)
from app.repositories.business_profile_repository import BusinessProfileRepository
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.repositories.venue_repository import VenueRepository
from app.schemas.venue import (
    BookingPreviewRequest,
    BookingPreviewResponse,
    DocumentInput,
    DocumentResponse,
    FoodSlotResponse,
    GalleryItemInput,
    GalleryItemResponse,
    MessageResponse,
    PricingInput,
    PricingResponse,
    PricingSlotResponse,
    VenueCreateRequest,
    VenueDetailResponse,
    VenueListItem,
    VenueListResponse,
    VenueMutationResponse,
    VenueOverview,
    VenueUpdateRequest,
    _initials,
)
from app.services.permission_service import DataScope, PermissionService

PLATFORM_COMMISSION_PERCENT = Decimal("2")
DOCUMENT_SLOTS = [
    "Venue License",
    "Fire Safety Certificate",
    "Insurance Certificate",
    "Government Approval",
    "Food License",
    "Other Documents",
]


class VenueService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = VenueRepository(db)
        self.profiles = BusinessProfileRepository(db)
        self.owners = VenueOwnerRepository(db)
        self.permissions = PermissionService(db)

    async def _vendor_owner_id(self, actor: User) -> uuid.UUID | None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return None
        if scope == DataScope.VENDOR_OWNED:
            owner = await self.owners.get_by_user_id(actor.id)
            if owner is None:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Venue owner profile is required to manage venues.",
                )
            return owner.id
        if scope == DataScope.CUSTOMER_OWNED:
            return None
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access venues.",
        )

    def _is_customer_scope(self, actor: User) -> bool:
        return self.permissions.get_data_scope(actor) == DataScope.CUSTOMER_OWNED

    def _assert_access(self, actor: User, venue: Venue) -> None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return
        if scope == DataScope.CUSTOMER_OWNED:
            if (
                venue.venue_status != VenueStatus.PUBLISHED.value
                or venue.approval_status != "approved"
            ):
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Venue is not publicly available.",
                )
            return
        if scope == DataScope.VENDOR_OWNED:
            profile = venue.business_profile
            owner = profile.venue_owner if profile else None
            if owner is None or owner.user_id != actor.id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="You can only access venues under your business profiles.",
                )
            return
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access venues.",
        )

    def _starting_price(self, venue: Venue) -> float:
        pricing = venue.pricing
        if not pricing:
            return 0.0
        if pricing.pricing_type == "venue_food":
            foods = [s for s in (pricing.food_slots or []) if s.enabled]
            if not foods:
                return 0.0
            return float(min(s.veg_plate_price for s in foods))
        slots = [s for s in (pricing.slots or []) if s.enabled]
        if not slots:
            return 0.0
        if pricing.pricing_mode == "full_day":
            full = next((s for s in slots if s.slot_key == "full_day"), slots[0])
            return float(full.slot_price)
        return float(min(s.slot_price for s in slots))

    def _pricing_response(self, venue: Venue) -> PricingResponse:
        pricing = venue.pricing
        if not pricing:
            return PricingResponse()
        return PricingResponse(
            id=pricing.id,
            pricing_mode=pricing.pricing_mode,
            pricing_type=pricing.pricing_type,
            gst_percent=float(pricing.gst_percent),
            gst_mode=pricing.gst_mode,
            advance_percent=float(pricing.advance_percent),
            booking_window_days=pricing.booking_window_days,
            minimum_notice_hours=pricing.minimum_notice_hours,
            operating_hours=pricing.operating_hours or venue.operating_hours,
            booking_confirmation=pricing.booking_confirmation,
            cancellation_preset=pricing.cancellation_preset,
            slots=[
                PricingSlotResponse(
                    id=s.id,
                    key=s.slot_key,
                    name=s.slot_name,
                    enabled=s.enabled,
                    time_label=s.time_label,
                    price=float(s.slot_price),
                    min_booking_amount=float(s.min_booking_amount),
                    max_guests=s.max_guests,
                    display_order=s.display_order,
                )
                for s in sorted(pricing.slots or [], key=lambda x: x.display_order)
            ],
            food_slots=[
                FoodSlotResponse(
                    id=s.id,
                    key=s.meal_key,
                    name=s.meal_name,
                    enabled=s.enabled,
                    time_label=s.time_label,
                    veg_plate_cost=float(s.veg_plate_price),
                    non_veg_plate_cost=float(s.non_veg_plate_price),
                    min_guests=s.minimum_guests,
                    max_guests=s.maximum_guests,
                    display_order=s.display_order,
                )
                for s in sorted(pricing.food_slots or [], key=lambda x: x.display_order)
            ],
        )

    def _to_list_item(self, venue: Venue) -> VenueListItem:
        profile = venue.business_profile
        owner = profile.venue_owner if profile else None
        return VenueListItem(
            id=venue.id,
            venue_code=venue.venue_code,
            venue_name=venue.venue_name,
            category=venue.category,
            venue_type=venue.venue_type,
            city=venue.city,
            venue_status=venue.venue_status,
            approval_status=venue.approval_status,
            availability_status=venue.availability_status,
            seating_capacity=venue.seating_capacity,
            maximum_guests=venue.maximum_guests,
            business_profile_id=venue.business_profile_id,
            business_name=profile.business_name if profile else "",
            owner_name=owner.full_name if owner else "",
            featured=venue.featured,
            cover_image_url=venue.cover_image_url,
            starting_price=self._starting_price(venue),
            rating=0.0,
            total_bookings=0,
            created_at=venue.created_at,
            initials=_initials(venue.venue_name),
        )

    async def _to_detail(self, venue: Venue) -> VenueDetailResponse:
        profile = venue.business_profile
        owner = profile.venue_owner if profile else None
        amenities = [
            link.amenity.name
            for link in (venue.amenity_links or [])
            if link.amenity
        ]
        services = [
            link.service.name
            for link in (venue.service_links or [])
            if link.service
        ]
        events = [
            link.event_type.name
            for link in (venue.event_links or [])
            if link.event_type
        ]
        docs = [
            DocumentResponse(
                id=d.id,
                name=d.name,
                document_type=d.document_type,
                status=d.status,
                file_name=d.file_name,
                file_size=d.file_size,
                file_url=d.file_url,
                verified_by=d.verified_by,
                uploaded_date=d.uploaded_at.date() if d.uploaded_at else None,
            )
            for d in (venue.documents or [])
            if d.deleted_at is None
        ]
        gallery = [
            GalleryItemResponse(
                id=g.id,
                image_url=g.image_url,
                image_type=g.image_type,
                caption=g.caption,
                display_order=g.display_order,
            )
            for g in (venue.gallery_items or [])
            if g.deleted_at is None
        ]
        return VenueDetailResponse(
            id=venue.id,
            venue_code=venue.venue_code,
            business_profile_id=venue.business_profile_id,
            business_name=profile.business_name if profile else "",
            owner_id=owner.id if owner else None,
            owner_name=owner.full_name if owner else "",
            owner_email=owner.email if owner else "",
            owner_phone=owner.mobile if owner else "",
            venue_name=venue.venue_name,
            category=venue.category,
            venue_type=venue.venue_type,
            short_description=venue.short_description,
            description=venue.description,
            house_rules=venue.house_rules,
            highlights=venue.highlights,
            featured=venue.featured,
            address_line1=venue.address_line1,
            address_line2=venue.address_line2,
            city=venue.city,
            state=venue.state,
            country=venue.country,
            postal_code=venue.postal_code,
            latitude=venue.latitude,
            longitude=venue.longitude,
            google_map_url=venue.google_map_url,
            landmark=venue.landmark,
            minimum_guests=venue.minimum_guests,
            maximum_guests=venue.maximum_guests,
            seating_capacity=venue.seating_capacity,
            dining_capacity=venue.dining_capacity,
            floating_capacity=venue.floating_capacity,
            venue_status=venue.venue_status,
            approval_status=venue.approval_status,
            availability_status=venue.availability_status,
            operating_hours=venue.operating_hours,
            weekly_off=venue.weekly_off,
            check_in_time=venue.check_in_time,
            check_out_time=venue.check_out_time,
            contact_person=venue.contact_person,
            contact_phone=venue.contact_phone,
            contact_email=venue.contact_email,
            support_email=venue.support_email,
            support_phone=venue.support_phone,
            notes=venue.notes,
            smoking_policy=venue.smoking_policy,
            alcohol_policy=venue.alcohol_policy,
            outside_catering=venue.outside_catering,
            outside_decorations=venue.outside_decorations,
            outside_photography=venue.outside_photography,
            pets_allowed=venue.pets_allowed,
            cancellation_policy=venue.cancellation_policy,
            refund_policy=venue.refund_policy,
            cover_image_url=venue.cover_image_url,
            video_url=venue.video_url,
            created_at=venue.created_at,
            updated_at=venue.updated_at,
            created_by=venue.created_by,
            updated_by=venue.updated_by,
            initials=_initials(venue.venue_name),
            overview=VenueOverview(
                availability_status=venue.availability_status,
                opening_hours=venue.operating_hours,
            ),
            amenities=amenities,
            services=services,
            event_categories=events,
            pricing=self._pricing_response(venue),
            gallery=gallery,
            documents=docs,
        )

    async def _sync_mappings(
        self,
        venue: Venue,
        *,
        amenities: list[str] | None,
        services: list[str] | None,
        event_categories: list[str] | None,
    ) -> None:
        if amenities is not None:
            venue.amenity_links.clear()
            await self.db.flush()
            for name in amenities:
                if not name.strip():
                    continue
                amenity = await self.repo.get_or_create_amenity(name)
                venue.amenity_links.append(
                    VenueAmenityMapping(amenity_id=amenity.id)
                )
        if services is not None:
            venue.service_links.clear()
            await self.db.flush()
            for name in services:
                if not name.strip():
                    continue
                service = await self.repo.get_or_create_service(name)
                venue.service_links.append(
                    VenueServiceMapping(service_id=service.id)
                )
        if event_categories is not None:
            venue.event_links.clear()
            await self.db.flush()
            for name in event_categories:
                if not name.strip():
                    continue
                event = await self.repo.get_or_create_event_type(name)
                venue.event_links.append(
                    VenueEventMapping(event_type_id=event.id)
                )

    def _apply_pricing(self, venue: Venue, pricing_in: PricingInput) -> None:
        if venue.pricing is None:
            venue.pricing = VenuePricing(venue_id=venue.id)
        pricing = venue.pricing
        pricing.pricing_mode = pricing_in.pricing_mode
        pricing.pricing_type = pricing_in.pricing_type
        pricing.gst_percent = pricing_in.gst_percent
        pricing.gst_mode = pricing_in.gst_mode
        pricing.advance_percent = pricing_in.advance_percent
        pricing.booking_window_days = pricing_in.booking_window_days
        pricing.minimum_notice_hours = pricing_in.minimum_notice_hours
        pricing.operating_hours = pricing_in.operating_hours
        pricing.booking_confirmation = pricing_in.booking_confirmation
        pricing.cancellation_preset = pricing_in.cancellation_preset
        pricing.slots.clear()
        pricing.food_slots.clear()
        for idx, slot in enumerate(pricing_in.slots):
            pricing.slots.append(
                VenueSlot(
                    slot_key=slot.key,
                    slot_name=slot.name,
                    time_label=slot.time_label,
                    slot_price=slot.price,
                    min_booking_amount=slot.min_booking_amount,
                    max_guests=slot.max_guests,
                    enabled=slot.enabled,
                    display_order=slot.display_order or idx,
                )
            )
        for idx, slot in enumerate(pricing_in.food_slots):
            pricing.food_slots.append(
                VenueFoodSlot(
                    meal_key=slot.key,
                    meal_name=slot.name,
                    time_label=slot.time_label,
                    veg_plate_price=slot.veg_plate_cost,
                    non_veg_plate_price=slot.non_veg_plate_cost,
                    minimum_guests=slot.min_guests,
                    maximum_guests=slot.max_guests,
                    enabled=slot.enabled,
                    display_order=slot.display_order or idx,
                )
            )

    def _apply_gallery(self, venue: Venue, items: list[GalleryItemInput]) -> None:
        venue.gallery_items.clear()
        for idx, item in enumerate(items):
            venue.gallery_items.append(
                VenueGalleryItem(
                    image_url=item.image_url,
                    image_type=item.image_type,
                    caption=item.caption,
                    display_order=item.display_order or idx,
                )
            )
            if item.image_type == "cover" and not venue.cover_image_url:
                venue.cover_image_url = item.image_url

    def _apply_documents(self, venue: Venue, docs: list[DocumentInput]) -> None:
        existing = {d.name: d for d in venue.documents if d.deleted_at is None}
        for item in docs:
            uploaded = (
                datetime.combine(item.uploaded_date, datetime.min.time()).replace(tzinfo=UTC)
                if item.uploaded_date
                else None
            )
            if item.name in existing:
                doc = existing[item.name]
                doc.document_type = item.document_type or item.name
                doc.status = item.status
                doc.file_name = item.file_name
                doc.file_size = item.file_size
                if item.file_url:
                    doc.file_url = item.file_url
                doc.verified_by = item.verified_by
                if uploaded:
                    doc.uploaded_at = uploaded
            else:
                venue.documents.append(
                    VenueDocument(
                        document_type=item.document_type or item.name,
                        name=item.name,
                        status=item.status,
                        file_name=item.file_name,
                        file_size=item.file_size,
                        file_url=item.file_url,
                        verified_by=item.verified_by,
                        uploaded_at=uploaded,
                    )
                )

    async def list_venues(
        self,
        actor: User,
        *,
        search: str | None = None,
        venue_status: str | None = None,
        approval_status: str | None = None,
        category: str | None = None,
        venue_type: str | None = None,
        city: str | None = None,
        business_profile_id: uuid.UUID | None = None,
        sort_by: str = "venue_name",
        sort_dir: str = "asc",
        page: int = 1,
        page_size: int = 10,
    ) -> VenueListResponse:
        owner_id = await self._vendor_owner_id(actor)
        published_only = self._is_customer_scope(actor)
        rows, total = await self.repo.list_venues(
            search=search,
            venue_status=venue_status,
            approval_status=approval_status,
            category=category,
            venue_type=venue_type,
            city=city,
            business_profile_id=business_profile_id,
            venue_owner_id=owner_id,
            published_only=published_only,
            sort_by=sort_by,
            sort_dir=sort_dir,
            page=page,
            page_size=page_size,
        )
        # load pricing slots for starting price
        for row in rows:
            if row.pricing:
                await self.db.refresh(row.pricing, attribute_names=["slots", "food_slots"])
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return VenueListResponse(
            items=[self._to_list_item(v) for v in rows],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_venue(self, actor: User, venue_id: uuid.UUID) -> VenueDetailResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        return await self._to_detail(venue)

    async def create_venue(
        self, actor: User, payload: VenueCreateRequest
    ) -> VenueMutationResponse:
        owner_id = await self._vendor_owner_id(actor)
        profile = await self.profiles.get_by_id(payload.business_profile_id)
        if profile is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Business profile not found.",
            )
        if owner_id is not None and profile.venue_owner_id != owner_id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="You can only create venues under your own business profiles.",
            )

        venue = Venue(
            tenant_id=profile.tenant_id,
            business_profile_id=profile.id,
            venue_code=await self.repo.next_venue_code(),
            venue_name=payload.venue_name,
            category=payload.category,
            venue_type=payload.venue_type,
            short_description=payload.short_description,
            description=payload.description,
            house_rules=payload.house_rules,
            highlights=payload.highlights,
            featured=payload.featured,
            address_line1=payload.address_line1,
            address_line2=payload.address_line2,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            postal_code=payload.postal_code,
            latitude=payload.latitude,
            longitude=payload.longitude,
            google_map_url=payload.google_map_url,
            landmark=payload.landmark,
            minimum_guests=payload.minimum_guests,
            maximum_guests=payload.maximum_guests,
            seating_capacity=payload.seating_capacity,
            dining_capacity=payload.dining_capacity,
            floating_capacity=payload.floating_capacity,
            venue_status=payload.venue_status,
            approval_status=payload.approval_status,
            availability_status=payload.availability_status,
            operating_hours=payload.operating_hours,
            weekly_off=payload.weekly_off,
            check_in_time=payload.check_in_time,
            check_out_time=payload.check_out_time,
            contact_person=payload.contact_person,
            contact_phone=payload.contact_phone,
            contact_email=payload.contact_email,
            support_email=payload.support_email,
            support_phone=payload.support_phone,
            notes=payload.notes,
            smoking_policy=payload.smoking_policy,
            alcohol_policy=payload.alcohol_policy,
            outside_catering=payload.outside_catering,
            outside_decorations=payload.outside_decorations,
            outside_photography=payload.outside_photography,
            pets_allowed=payload.pets_allowed,
            cancellation_policy=payload.cancellation_policy,
            refund_policy=payload.refund_policy,
            cover_image_url=payload.cover_image_url,
            video_url=payload.video_url,
            created_by=actor.id,
            updated_by=actor.id,
        )
        await self.repo.create(venue)
        await self._sync_mappings(
            venue,
            amenities=payload.amenities,
            services=payload.services,
            event_categories=payload.event_categories,
        )
        if payload.pricing:
            self._apply_pricing(venue, payload.pricing)
        else:
            venue.pricing = VenuePricing()
        if payload.gallery:
            self._apply_gallery(venue, payload.gallery)
        if payload.documents:
            self._apply_documents(venue, payload.documents)
        else:
            for slot in DOCUMENT_SLOTS:
                venue.documents.append(
                    VenueDocument(document_type=slot, name=slot, status="pending")
                )
        await self.db.commit()
        venue = await self.repo.get_by_id(venue.id)
        assert venue is not None
        return VenueMutationResponse(
            message="Venue created successfully.",
            venue=await self._to_detail(venue),
        )

    async def update_venue(
        self, actor: User, venue_id: uuid.UUID, payload: VenueUpdateRequest
    ) -> VenueMutationResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        if self._is_customer_scope(actor):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot update venues.",
            )

        data = payload.model_dump(
            exclude_unset=True,
            exclude={"amenities", "services", "event_categories", "pricing", "gallery", "documents"},
        )
        for key, value in data.items():
            setattr(venue, key, value)

        await self._sync_mappings(
            venue,
            amenities=payload.amenities,
            services=payload.services,
            event_categories=payload.event_categories,
        )
        if payload.pricing is not None:
            self._apply_pricing(venue, payload.pricing)
        if payload.gallery is not None:
            self._apply_gallery(venue, payload.gallery)
        if payload.documents is not None:
            self._apply_documents(venue, payload.documents)

        venue.updated_by = actor.id
        await self.db.commit()
        venue = await self.repo.get_by_id(venue.id)
        assert venue is not None
        return VenueMutationResponse(
            message="Venue updated successfully.",
            venue=await self._to_detail(venue),
        )

    async def delete_venue(self, actor: User, venue_id: uuid.UUID) -> MessageResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        if self._is_customer_scope(actor):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot delete venues.",
            )
        # Bookings/invoices/payments modules not present yet.
        await self.repo.soft_delete(venue, updated_by=actor.id)
        await self.db.commit()
        return MessageResponse(message="Venue deleted successfully.")

    async def get_pricing(self, actor: User, venue_id: uuid.UUID) -> PricingResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        return self._pricing_response(venue)

    async def get_gallery(
        self, actor: User, venue_id: uuid.UUID
    ) -> list[GalleryItemResponse]:
        detail = await self.get_venue(actor, venue_id)
        return detail.gallery

    async def get_documents(
        self, actor: User, venue_id: uuid.UUID
    ) -> list[DocumentResponse]:
        detail = await self.get_venue(actor, venue_id)
        return detail.documents

    async def preview_booking(
        self, actor: User, venue_id: uuid.UUID, payload: BookingPreviewRequest
    ) -> BookingPreviewResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        pricing = venue.pricing
        if pricing is None:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Venue pricing is not configured.",
            )

        venue_price = Decimal("0")
        food_total = Decimal("0")
        if pricing.pricing_type == "venue_only":
            slots = [s for s in pricing.slots if s.enabled]
            if pricing.pricing_mode == "full_day":
                slot = next((s for s in slots if s.slot_key == "full_day"), None)
            else:
                key = payload.slot_key
                slot = next((s for s in slots if s.slot_key == key), None) if key else None
                if slot is None and slots:
                    slot = slots[0]
            if slot:
                venue_price = slot.slot_price
        else:
            foods = [s for s in pricing.food_slots if s.enabled]
            meal = None
            if payload.food_meal_key:
                meal = next((s for s in foods if s.meal_key == payload.food_meal_key), None)
            if meal is None and foods:
                meal = foods[0]
            if meal:
                plate = (
                    meal.veg_plate_price
                    if payload.plate_type == "veg"
                    else meal.non_veg_plate_price
                )
                food_total = plate * Decimal(payload.guests)

        subtotal = venue_price + food_total
        gst_extra = (
            (subtotal * pricing.gst_percent / Decimal("100")).quantize(Decimal("1"))
            if pricing.gst_percent > 0
            else Decimal("0")
        )
        booking_total = subtotal + gst_extra
        advance = min(
            (booking_total * pricing.advance_percent / Decimal("100")).quantize(Decimal("1")),
            booking_total,
        )
        commission = (advance * PLATFORM_COMMISSION_PERCENT / Decimal("100")).quantize(
            Decimal("1")
        )
        vendor = max(advance - commission, Decimal("0"))
        remaining = max(booking_total - advance, Decimal("0"))
        return BookingPreviewResponse(
            venue_price=float(venue_price),
            food_total=float(food_total),
            subtotal=float(subtotal),
            gst_extra=float(gst_extra),
            booking_total=float(booking_total),
            advance_payable=float(advance),
            platform_commission=float(commission),
            vendor_receivable=float(vendor),
            remaining_balance=float(remaining),
            gst_percent=float(pricing.gst_percent),
            advance_percent=float(pricing.advance_percent),
            platform_commission_percent=float(PLATFORM_COMMISSION_PERCENT),
        )

    async def upload_document(
        self,
        actor: User,
        venue_id: uuid.UUID,
        *,
        document_type: str,
        name: str | None,
        upload: UploadFile,
    ) -> DocumentResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        file_name, file_size, file_url, mime = await save_venue_upload_file(
            venue_id=venue.id, upload=upload, document_type=document_type
        )
        display = (name or document_type).strip()
        existing = next(
            (
                d
                for d in venue.documents
                if d.deleted_at is None
                and (d.document_type == document_type or d.name == display)
            ),
            None,
        )
        if existing:
            existing.file_name = file_name
            existing.file_size = file_size
            existing.file_url = file_url
            existing.mime_type = mime
            existing.status = "uploaded"
            existing.uploaded_at = datetime.now(UTC)
            existing.name = display
            doc = existing
        else:
            doc = VenueDocument(
                venue_id=venue.id,
                document_type=document_type,
                name=display,
                file_name=file_name,
                file_size=file_size,
                file_url=file_url,
                mime_type=mime,
                status="uploaded",
                uploaded_at=datetime.now(UTC),
            )
            self.db.add(doc)
        venue.updated_by = actor.id
        await self.db.commit()
        await self.db.refresh(doc)
        return DocumentResponse(
            id=doc.id,
            name=doc.name,
            document_type=doc.document_type,
            status=doc.status,
            file_name=doc.file_name,
            file_size=doc.file_size,
            file_url=doc.file_url,
            verified_by=doc.verified_by,
            uploaded_date=doc.uploaded_at.date() if doc.uploaded_at else None,
        )

    async def upload_gallery(
        self,
        actor: User,
        venue_id: uuid.UUID,
        *,
        image_type: str,
        upload: UploadFile,
    ) -> GalleryItemResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        _, _, file_url, _ = await save_venue_upload_file(
            venue_id=venue.id, upload=upload, document_type=image_type
        )
        order = len([g for g in venue.gallery_items if g.deleted_at is None])
        item = VenueGalleryItem(
            venue_id=venue.id,
            image_url=file_url,
            image_type=image_type or "gallery",
            display_order=order,
        )
        self.db.add(item)
        if image_type == "cover":
            venue.cover_image_url = file_url
        venue.updated_by = actor.id
        await self.db.commit()
        await self.db.refresh(item)
        return GalleryItemResponse(
            id=item.id,
            image_url=item.image_url,
            image_type=item.image_type,
            caption=item.caption,
            display_order=item.display_order,
        )

    async def delete_document(
        self, actor: User, venue_id: uuid.UUID, document_id: uuid.UUID
    ) -> MessageResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        doc = next((d for d in venue.documents if d.id == document_id), None)
        if doc is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Document not found."
            )
        doc.deleted_at = datetime.now(UTC)
        await self.db.commit()
        return MessageResponse(message="Document deleted successfully.")

    async def delete_gallery_item(
        self, actor: User, venue_id: uuid.UUID, item_id: uuid.UUID
    ) -> MessageResponse:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        item = next((g for g in venue.gallery_items if g.id == item_id), None)
        if item is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Gallery item not found."
            )
        item.deleted_at = datetime.now(UTC)
        await self.db.commit()
        return MessageResponse(message="Gallery item deleted successfully.")

    async def approve_venue(
        self, actor: User, venue_id: uuid.UUID
    ) -> VenueMutationResponse:
        if self.permissions.get_data_scope(actor) != DataScope.ALL:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Only admins can approve venues.",
            )
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        venue.approval_status = "approved"
        venue.venue_status = VenueStatus.PUBLISHED.value
        venue.approved_by = actor.id
        venue.approved_at = datetime.now(UTC)
        venue.rejected_reason = None
        venue.updated_by = actor.id
        await self.db.commit()
        venue = await self.repo.get_by_id(venue.id)
        assert venue is not None
        return VenueMutationResponse(
            message="Venue approved.", venue=await self._to_detail(venue)
        )

    async def reject_venue(
        self, actor: User, venue_id: uuid.UUID, reason: str | None = None
    ) -> VenueMutationResponse:
        if self.permissions.get_data_scope(actor) != DataScope.ALL:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Only admins can reject venues.",
            )
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        venue.approval_status = "rejected"
        venue.rejected_reason = reason
        venue.updated_by = actor.id
        await self.db.commit()
        venue = await self.repo.get_by_id(venue.id)
        assert venue is not None
        return VenueMutationResponse(
            message="Venue rejected.", venue=await self._to_detail(venue)
        )

    async def list_meta(self, actor: User) -> dict:
        _ = actor
        return {
            "success": True,
            "amenities": [a.name for a in await self.repo.list_amenities()],
            "services": [s.name for s in await self.repo.list_services()],
            "event_types": [e.name for e in await self.repo.list_event_types()],
            "cities": await self.repo.distinct_cities(),
        }
