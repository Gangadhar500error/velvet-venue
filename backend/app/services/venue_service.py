import math
import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, UploadFile, status as http_status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import save_venue_upload_file
from app.core.venue_catalog import amenity_meta, service_icon
from app.models.user import User
from app.models.venue import (
    Venue,
    VenueAmenityMapping,
    VenueDocument,
    VenueEventMapping,
    VenueGalleryItem,
    VenuePricing,
    VenueServiceMapping,
    VenueStatus,
)
from app.repositories.availability_repository import (
    AvailabilityRepository,
    AvailabilitySlotRepository,
)
from app.repositories.booking_repository import BookingRepository
from app.repositories.business_profile_repository import BusinessProfileRepository
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.repositories.venue_repository import VenueRepository
from app.schemas.venue import (
    AmenityItem,
    AvailabilityDayNested,
    AvailabilitySlotNested,
    AvailabilityStatusNested,
    BookingPreviewRequest,
    BookingPreviewResponse,
    BookingSummary,
    BusinessProfileNested,
    CapacitiesNested,
    ContactNested,
    DocumentInput,
    DocumentResponse,
    EventCategoryItem,
    FaqItem,
    GalleryItemInput,
    GalleryItemResponse,
    LocationNested,
    MessageResponse,
    OwnerNested,
    PoliciesNested,
    PricingInput,
    PricingResponse,
    RelatedVenueItem,
    ReviewItem,
    ReviewsBlock,
    SeoBlock,
    ServiceItem,
    StatisticsNested,
    VenueCreateRequest,
    VenueDetailResponse,
    VenueListItem,
    VenueListResponse,
    VenueSearchItem,
    VenueSearchResponse,
    VenueMutationResponse,
    VenueOverview,
    VenueUpdateRequest,
    _initials,
)
from app.services.availability_dashboard_service import AvailabilityDashboardService
from app.services.availability_generator_service import AvailabilityGeneratorService
from app.services.permission_service import DataScope, PermissionService
from app.services.pricing_service import PricingService
from app.utils.availability_dates import month_bounds
from app.utils.time_ranges import format_clock, parse_time_range

DETAIL_AVAILABILITY_DAYS = 60

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
        self.bookings = BookingRepository(db)
        self.permissions = PermissionService(db)
        self.pricing = PricingService(db)
        self.availability_days = AvailabilityRepository(db)
        self.availability_slots = AvailabilitySlotRepository(db)
        self.availability_generator = AvailabilityGeneratorService(db)

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
        pricing = venue.active_pricing()
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
        detail = self.pricing.to_detail(venue.active_pricing())
        if detail.operating_hours is None:
            detail.operating_hours = venue.operating_hours
        return detail

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

    def _gallery_response(self, item: VenueGalleryItem) -> GalleryItemResponse:
        return GalleryItemResponse(
            id=item.id,
            image_url=item.image_url,
            thumbnail_url=item.thumbnail_url or item.image_url,
            title=item.title or item.caption,
            image_type=item.image_type,
            media_type=item.media_type or "image",
            is_cover=bool(item.is_cover or item.image_type == "cover"),
            caption=item.caption,
            display_order=item.display_order,
        )

    def _document_response(self, doc: VenueDocument) -> DocumentResponse:
        return DocumentResponse(
            id=doc.id,
            name=doc.name,
            document_type=doc.document_type,
            status=doc.status,
            file_name=doc.file_name,
            file_size=doc.file_size,
            file_url=doc.file_url,
            verified_by=doc.verified_by,
            expiry_date=doc.expiry_date,
            verified_at=doc.verified_at,
            uploaded_date=doc.uploaded_at.date() if doc.uploaded_at else None,
        )

    def _amenity_items(self, venue: Venue) -> list[AmenityItem]:
        items: list[AmenityItem] = []
        for link in venue.amenity_links or []:
            amenity = link.amenity
            if amenity is None:
                continue
            icon, category = amenity_meta(amenity.code, amenity.name)
            items.append(
                AmenityItem(
                    id=amenity.id,
                    name=amenity.name,
                    icon=amenity.icon or icon,
                    category=amenity.category or category,
                )
            )
        return items

    def _service_items(self, venue: Venue) -> list[ServiceItem]:
        items: list[ServiceItem] = []
        for link in venue.service_links or []:
            service = link.service
            if service is None:
                continue
            items.append(
                ServiceItem(
                    id=service.id,
                    name=service.name,
                    icon=service.icon or service_icon(service.code, service.name),
                    description=service.description,
                )
            )
        return items

    def _event_items(self, venue: Venue) -> list[EventCategoryItem]:
        return [
            EventCategoryItem(id=link.event_type.id, name=link.event_type.name)
            for link in (venue.event_links or [])
            if link.event_type
        ]

    def _related_item(self, venue: Venue) -> RelatedVenueItem:
        return RelatedVenueItem(
            id=venue.id,
            venue_code=venue.venue_code,
            venue_name=venue.venue_name,
            city=venue.city,
            category=venue.category,
            cover_image_url=venue.cover_image_url,
            starting_price=self._starting_price(venue),
            rating=0.0,
        )

    def _reviews_block(self, venue: Venue) -> ReviewsBlock:
        published = [
            r
            for r in (venue.review_items or [])
            if r.deleted_at is None and r.is_published
        ]
        total = len(published)
        average = round(sum(r.rating for r in published) / total, 2) if total else 0.0
        return ReviewsBlock(
            average_rating=average,
            total_reviews=total,
            items=[
                ReviewItem(
                    id=r.id,
                    customer_name=r.customer_name,
                    rating=r.rating,
                    comment=r.comment,
                    event_type=r.event_type,
                    created_at=r.created_at,
                    reply=r.reply,
                )
                for r in published[:20]
            ],
        )

    def _seo_block(self, venue: Venue) -> SeoBlock:
        city = venue.city or "India"
        return SeoBlock(
            title=venue.seo_title or f"{venue.venue_name} | {city}",
            description=venue.seo_description or venue.short_description,
            keywords=venue.seo_keywords
            or ", ".join(filter(None, [venue.category, venue.venue_type, venue.city])),
            canonical=venue.seo_canonical,
        )

    def _clock(self, value) -> str | None:
        if value is None:
            return None
        if hasattr(value, "hour"):
            return format_clock(value)
        return str(value)

    def _availability_days(
        self,
        venue: Venue,
        rows,
    ) -> list[AvailabilityDayNested]:
        pricing = venue.active_pricing()
        slot_prices = {
            s.id: float(s.slot_price)
            for s in ((pricing.slots if pricing else []) or [])
            if s.deleted_at is None
        }
        food_prices = {
            s.id: float(s.veg_plate_price)
            for s in ((pricing.food_slots if pricing else []) or [])
            if s.deleted_at is None
        }
        slot_times = {
            s.id: (s.start_time, s.end_time)
            for s in ((pricing.slots if pricing else []) or [])
            if s.deleted_at is None
        }
        food_times = {
            s.id: (s.start_time, s.end_time)
            for s in ((pricing.food_slots if pricing else []) or [])
            if s.deleted_at is None
        }
        days: list[AvailabilityDayNested] = []
        for row in rows:
            nested_slots: list[AvailabilitySlotNested] = []
            for slot in row.slots or []:
                start, end = parse_time_range(slot.time_label)
                if slot.slot_id and slot.slot_id in slot_times:
                    timed = slot_times[slot.slot_id]
                    start = timed[0] or start
                    end = timed[1] or end
                if slot.food_slot_id and slot.food_slot_id in food_times:
                    timed = food_times[slot.food_slot_id]
                    start = timed[0] or start
                    end = timed[1] or end
                price = None
                if slot.slot_id and slot.slot_id in slot_prices:
                    price = slot_prices[slot.slot_id]
                elif slot.food_slot_id and slot.food_slot_id in food_prices:
                    price = food_prices[slot.food_slot_id]
                nested_slots.append(
                    AvailabilitySlotNested(
                        slot_id=slot.slot_id,
                        food_slot_id=slot.food_slot_id,
                        slot_name=slot.slot_name,
                        slot_key=slot.slot_key,
                        slot_kind=slot.slot_kind,
                        status=slot.status,
                        start_time=self._clock(start),
                        end_time=self._clock(end),
                        price=price,
                    )
                )
            days.append(
                AvailabilityDayNested(
                    date=row.availability_date,
                    status=row.status,
                    slots=nested_slots,
                )
            )
        return days

    async def _to_detail(self, venue: Venue) -> VenueDetailResponse:
        profile = venue.business_profile
        owner = profile.venue_owner if profile else None
        owner_id = owner.id if owner else None
        owner_name = owner.full_name if owner else ""
        owner_email = owner.email if owner else ""
        owner_phone = owner.mobile if owner else ""
        business_name = profile.business_name if profile else ""
        docs = [
            self._document_response(d)
            for d in (venue.documents or [])
            if d.deleted_at is None
        ]
        gallery = [
            self._gallery_response(g)
            for g in (venue.gallery_items or [])
            if g.deleted_at is None
        ]
        reviews = self._reviews_block(venue)
        today = date.today()
        summary_raw = await self.availability_slots.booking_summary(venue.id, today)
        booking_summary = BookingSummary(**summary_raw)
        month_start, month_end = month_bounds(today.year, today.month)
        dashboard = await AvailabilityDashboardService(
            self.availability_days, self.availability_slots
        ).for_range(venue.id, month_start, month_end, today)
        window_end = today + timedelta(days=DETAIL_AVAILABILITY_DAYS)
        availability_rows = await self.availability_days.list_range(
            venue.id, today, window_end
        )
        availability = self._availability_days(venue, availability_rows)
        today_status = next(
            (row.status for row in availability_rows if row.availability_date == today),
            venue.availability_status,
        )
        related = await self.repo.list_related(venue)
        similar = await self.repo.list_similar(
            venue, exclude_ids=[item.id for item in related]
        )
        faqs = [
            FaqItem(
                id=f.id,
                question=f.question,
                answer=f.answer,
                display_order=f.display_order,
            )
            for f in (venue.faqs or [])
            if f.deleted_at is None and f.is_active
        ]
        statistics = StatisticsNested(
            todays_bookings=booking_summary.today_bookings,
            upcoming_events=booking_summary.upcoming_bookings,
            completed_events=booking_summary.completed_bookings,
            cancelled_events=booking_summary.cancelled_bookings,
            occupancy_percentage=dashboard.occupancy_percent,
            revenue=0.0,
            average_rating=reviews.average_rating,
            review_count=reviews.total_reviews,
        )
        return VenueDetailResponse(
            id=venue.id,
            venue_code=venue.venue_code,
            business_profile_id=venue.business_profile_id,
            business_name=business_name,
            owner_id=owner_id,
            owner_name=owner_name,
            owner_email=owner_email,
            owner_phone=owner_phone,
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
            status=venue.venue_status,
            business_profile=BusinessProfileNested(
                id=profile.id,
                business_name=profile.business_name,
                business_type=profile.business_type,
                logo=None,
                verified=profile.verification_status == "verified",
            )
            if profile
            else None,
            owner=OwnerNested(
                id=owner_id,
                name=owner_name,
                email=owner_email,
                phone=owner_phone,
            ),
            location=LocationNested(
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
            ),
            capacities=CapacitiesNested(
                minimum_guests=venue.minimum_guests,
                maximum_guests=venue.maximum_guests,
                seating_capacity=venue.seating_capacity,
                dining_capacity=venue.dining_capacity,
                floating_capacity=venue.floating_capacity,
            ),
            contact=ContactNested(
                contact_person=venue.contact_person,
                contact_phone=venue.contact_phone,
                contact_email=venue.contact_email,
                support_email=venue.support_email,
                support_phone=venue.support_phone,
            ),
            policies=PoliciesNested(
                smoking_policy=venue.smoking_policy,
                alcohol_policy=venue.alcohol_policy,
                outside_catering=venue.outside_catering,
                outside_decorations=venue.outside_decorations,
                outside_photography=venue.outside_photography,
                pets_allowed=venue.pets_allowed,
                cancellation_policy=venue.cancellation_policy,
                refund_policy=venue.refund_policy,
            ),
            statistics=statistics,
            overview=VenueOverview(
                todays_bookings=booking_summary.today_bookings,
                upcoming_events=booking_summary.upcoming_bookings,
                revenue=0.0,
                average_rating=reviews.average_rating,
                reviews_count=reviews.total_reviews,
                availability_status=venue.availability_status,
                opening_hours=venue.operating_hours,
            ),
            amenities=self._amenity_items(venue),
            services=self._service_items(venue),
            event_categories=self._event_items(venue),
            pricing=self._pricing_response(venue),
            gallery=gallery,
            documents=docs,
            bookings=[],
            booking_summary=booking_summary,
            reviews=reviews,
            availability=availability,
            availability_status_detail=AvailabilityStatusNested(
                label=venue.availability_status,
                today=today_status,
                occupancy_percentage=dashboard.occupancy_percent,
                available_days=dashboard.available_days,
                booked_days=dashboard.booked_days,
                blocked_days=dashboard.blocked_days,
            ),
            related_venues=[self._related_item(v) for v in related],
            similar_venues=[self._related_item(v) for v in similar],
            faqs=faqs,
            seo=self._seo_block(venue),
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

    def _apply_pricing(self, venue: Venue, pricing_in: PricingInput, actor_id: uuid.UUID | None = None) -> None:
        published = venue.venue_status == VenueStatus.PUBLISHED.value
        self.pricing.apply_nested(
            venue,
            pricing_in,
            actor_id=actor_id,
            require_positive_price=published,
        )

    def _apply_gallery(self, venue: Venue, items: list[GalleryItemInput]) -> None:
        existing = [g for g in venue.gallery_items if g.deleted_at is None]
        by_id = {g.id: g for g in existing}
        by_url = {g.image_url: g for g in existing}
        keep: list[VenueGalleryItem] = []
        seen_urls: set[str] = set()
        for idx, item in enumerate(items):
            url = (item.image_url or "").strip()
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            current = by_id.get(item.id) if item.id else None
            if current is None:
                current = by_url.get(url)
            if current is None:
                current = VenueGalleryItem(image_url=url)
                venue.gallery_items.append(current)
            current.image_url = url
            current.thumbnail_url = item.thumbnail_url or url
            current.title = item.title or item.caption
            current.image_type = item.image_type
            current.media_type = item.media_type or (
                "360" if item.image_type == "360" else "image"
            )
            current.is_cover = bool(item.is_cover or item.image_type == "cover")
            current.caption = item.caption
            current.display_order = item.display_order or idx
            keep.append(current)
            if current.is_cover:
                venue.cover_image_url = url
        keep_ids = {g.id for g in keep if g.id}
        for gallery_item in existing:
            if gallery_item.id not in keep_ids and gallery_item not in keep:
                gallery_item.deleted_at = datetime.now(UTC)

    def _apply_documents(self, venue: Venue, docs: list[DocumentInput]) -> None:
        existing = [d for d in venue.documents if d.deleted_at is None]
        by_type = {d.document_type: d for d in existing}
        by_name = {d.name: d for d in existing}
        seen_types: set[str] = set()
        for item in docs:
            dtype = (item.document_type or item.name).strip()
            if not dtype or dtype in seen_types:
                continue
            seen_types.add(dtype)
            uploaded = (
                datetime.combine(item.uploaded_date, datetime.min.time()).replace(tzinfo=UTC)
                if item.uploaded_date
                else None
            )
            doc = by_type.get(dtype) or by_name.get(item.name)
            verified_at = item.verified_at
            if item.status == "verified" and verified_at is None:
                verified_at = datetime.now(UTC)
            if doc:
                doc.document_type = dtype
                doc.name = item.name
                doc.status = item.status
                doc.file_name = item.file_name
                doc.file_size = item.file_size
                if item.file_url:
                    doc.file_url = item.file_url
                doc.verified_by = item.verified_by
                doc.expiry_date = item.expiry_date
                doc.verified_at = verified_at
                if uploaded:
                    doc.uploaded_at = uploaded
            else:
                venue.documents.append(
                    VenueDocument(
                        document_type=dtype,
                        name=item.name,
                        status=item.status,
                        file_name=item.file_name,
                        file_size=item.file_size,
                        file_url=item.file_url,
                        verified_by=item.verified_by,
                        expiry_date=item.expiry_date,
                        verified_at=verified_at,
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
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return VenueListResponse(
            items=[self._to_list_item(v) for v in rows],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def _to_search_item(self, venue: Venue) -> VenueSearchItem:
        profile = venue.business_profile
        pricing = venue.active_pricing()
        return VenueSearchItem(
            id=venue.id,
            venue_code=venue.venue_code,
            venue_name=venue.venue_name,
            business_name=profile.business_name if profile else "",
            city=venue.city,
            category=venue.category,
            pricing_mode=pricing.pricing_mode if pricing else None,
            availability_status=venue.availability_status,
        )

    async def search_bookable_venues(
        self,
        actor: User,
        *,
        query: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> VenueSearchResponse:
        if self._is_customer_scope(actor):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot search venues from Booking Create.",
            )
        owner_id = await self._vendor_owner_id(actor)
        rows, total = await self.repo.list_venues(
            search=query,
            venue_status=VenueStatus.PUBLISHED.value,
            approval_status="approved",
            venue_owner_id=owner_id,
            published_only=True,
            exclude_blocked=True,
            sort_by="venue_name",
            sort_dir="asc",
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return VenueSearchResponse(
            items=[self._to_search_item(venue) for venue in rows],
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
        if venue.active_pricing() is not None:
            await self.availability_generator.generate_for_venue(
                venue.id, performed_by=actor.id, fill_missing_only=True
            )
            await self.db.commit()
            venue = await self.repo.get_by_id(venue.id)
            assert venue is not None
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
            self._apply_pricing(venue, payload.pricing, actor_id=actor.id)
        else:
            venue.pricing_records.append(
                VenuePricing(
                    id=uuid.uuid4(),
                    venue_id=venue.id,
                    created_by=actor.id,
                    updated_by=actor.id,
                )
            )
        if payload.gallery:
            self._apply_gallery(venue, payload.gallery)
        if payload.documents:
            self._apply_documents(venue, payload.documents)
        else:
            for slot in DOCUMENT_SLOTS:
                venue.documents.append(
                    VenueDocument(document_type=slot, name=slot, status="pending")
                )
        if payload.pricing:
            await self.pricing.sync_availability(venue.id, actor.id)
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
            self._apply_pricing(venue, payload.pricing, actor_id=actor.id)
        if payload.gallery is not None:
            self._apply_gallery(venue, payload.gallery)
        if payload.documents is not None:
            self._apply_documents(venue, payload.documents)

        venue.updated_by = actor.id
        if payload.pricing is not None or "weekly_off" in data:
            await self.pricing.sync_availability(venue.id, actor.id)
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
        booking_count = await self.bookings.count_for_venue(venue.id, include_deleted=True)
        try:
            await self.repo.soft_delete(venue, updated_by=actor.id)
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail=(
                    "Cannot remove this venue while bookings exist. "
                    "Delete or cancel those bookings first."
                ),
            ) from exc
        if booking_count:
            return MessageResponse(
                message="Venue archived. Existing bookings were kept and still reference this venue."
            )
        return MessageResponse(message="Venue deleted successfully.")

    async def get_pricing(self, actor: User, venue_id: uuid.UUID) -> PricingResponse:
        return await self.pricing.get_venue_pricing(actor, venue_id)

    async def get_gallery(
        self, actor: User, venue_id: uuid.UUID
    ) -> list[GalleryItemResponse]:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        return [
            self._gallery_response(g)
            for g in (venue.gallery_items or [])
            if g.deleted_at is None
        ]

    async def get_documents(
        self, actor: User, venue_id: uuid.UUID
    ) -> list[DocumentResponse]:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_access(actor, venue)
        return [
            self._document_response(d)
            for d in (venue.documents or [])
            if d.deleted_at is None
        ]

    async def preview_booking(
        self, actor: User, venue_id: uuid.UUID, payload: BookingPreviewRequest
    ) -> BookingPreviewResponse:
        return await self.pricing.preview_venue(actor, venue_id, payload)

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
        return self._document_response(doc)

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
        existing = next(
            (
                g
                for g in venue.gallery_items
                if g.deleted_at is None and g.image_url == file_url
            ),
            None,
        )
        if existing:
            item = existing
            item.image_type = image_type or item.image_type
            item.thumbnail_url = item.thumbnail_url or file_url
            item.is_cover = item.is_cover or image_type == "cover"
        else:
            order = len([g for g in venue.gallery_items if g.deleted_at is None])
            item = VenueGalleryItem(
                venue_id=venue.id,
                image_url=file_url,
                thumbnail_url=file_url,
                image_type=image_type or "gallery",
                media_type="360" if image_type == "360" else "image",
                is_cover=image_type == "cover",
                display_order=order,
            )
            self.db.add(item)
        if image_type == "cover":
            venue.cover_image_url = file_url
            item.is_cover = True
        venue.updated_by = actor.id
        await self.db.commit()
        await self.db.refresh(item)
        return self._gallery_response(item)

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
        amenities = await self.repo.list_amenities()
        services = await self.repo.list_services()
        events = await self.repo.list_event_types()
        return {
            "success": True,
            "amenities": [a.name for a in amenities],
            "services": [s.name for s in services],
            "event_types": [e.name for e in events],
            "amenity_items": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "icon": a.icon or amenity_meta(a.code, a.name)[0],
                    "category": a.category or amenity_meta(a.code, a.name)[1],
                }
                for a in amenities
            ],
            "service_items": [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "icon": s.icon or service_icon(s.code, s.name),
                    "description": s.description,
                }
                for s in services
            ],
            "event_items": [{"id": str(e.id), "name": e.name} for e in events],
            "cities": await self.repo.distinct_cities(),
        }
