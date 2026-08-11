from __future__ import annotations

import math
import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import (
    ApprovalStatus,
    Booking,
    BookingFood,
    BookingService as BookingServiceItem,
    BookingSlot,
    BookingStatus,
    Invoice,
    InvoiceStatus,
    InvoiceType,
    Payment,
    PaymentRecordStatus,
    PaymentStatus,
    PaymentType,
)
from app.models.user import User
from app.models.venue import Venue, VenueStatus
from app.repositories.availability_repository import AvailabilityRepository
from app.repositories.booking_repository import BookingRepository, new_day
from app.repositories.customer_repository import CustomerRepository
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.repositories.venue_repository import VenueRepository
from app.schemas.availability import BookingHoldRequest
from app.schemas.booking import (
    AvailabilityCheckResponse,
    BookingCalendarResponse,
    BookingCreateRequest,
    BookingDayResponse,
    BookingDetailResponse,
    BookingFoodResponse,
    BookingListItem,
    BookingListResponse,
    BookingMutationResponse,
    BookingQuoteResponse,
    BookingServiceResponse,
    BookingSlotResponse,
    BookingUpdateRequest,
    CalendarBookingItem,
    CancelRequest,
    InvoiceResponse,
    MessageResponse,
    NestedBusiness,
    NestedPerson,
    NestedVenue,
    PaymentCreateRequest,
    PaymentResponse,
    PaymentSummary,
    RejectRequest,
    RemainingSlot,
    TimelineItem,
)
from app.services.availability_generator_service import AvailabilityGeneratorService
from app.services.availability_service import AvailabilityService
from app.services.booking_quote_service import BookingQuote, BookingQuoteService
from app.services.permission_service import DataScope, PermissionService
from app.utils.availability_dates import month_bounds
from app.utils.time_ranges import format_clock, parse_time_range


class BookingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = BookingRepository(db)
        self.venues = VenueRepository(db)
        self.customers = CustomerRepository(db)
        self.owners = VenueOwnerRepository(db)
        self.permissions = PermissionService(db)
        self.quotes = BookingQuoteService()
        self.availability = AvailabilityService(db)
        self.availability_days = AvailabilityRepository(db)
        self.generator = AvailabilityGeneratorService(db)

    def _scope(self, actor: User) -> DataScope:
        return self.permissions.get_data_scope(actor)

    async def _vendor_id(self, actor: User) -> uuid.UUID | None:
        if self._scope(actor) != DataScope.VENDOR_OWNED:
            return None
        owner = await self.owners.get_by_user_id(actor.id)
        if owner is None:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Venue owner profile is required.",
            )
        return owner.id

    async def _customer_id(self, actor: User) -> uuid.UUID | None:
        if self._scope(actor) != DataScope.CUSTOMER_OWNED:
            return None
        customer = await self.customers.get_by_user_id(actor.id)
        if customer is None:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customer profile is required.",
            )
        return customer.id

    async def _assert_access(self, actor: User, booking: Booking) -> None:
        scope = self._scope(actor)
        if scope == DataScope.ALL:
            return
        if scope == DataScope.VENDOR_OWNED:
            vendor_id = await self._vendor_id(actor)
            if booking.vendor_id != vendor_id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="You can only access bookings for your own venues.",
                )
            return
        customer_id = await self._customer_id(actor)
        if booking.customer_id != customer_id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="You can only access your own bookings.",
            )

    async def _load_booking(self, actor: User, booking_id: uuid.UUID) -> Booking:
        booking = await self.repo.get_by_id(booking_id)
        if booking is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Booking not found.")
        await self._assert_access(actor, booking)
        return booking

    async def _load_venue(self, venue_id: uuid.UUID) -> Venue:
        venue = await self.venues.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found.")
        return venue

    def _capacity(self, venue: Venue) -> int | None:
        return venue.maximum_guests or venue.seating_capacity

    def _to_list_item(self, booking: Booking) -> BookingListItem:
        customer = booking.customer
        vendor = booking.vendor
        profile = booking.business_profile
        venue = booking.venue
        return BookingListItem(
            id=booking.id,
            booking_number=booking.booking_number,
            customer_id=booking.customer_id,
            customer_name=customer.full_name if customer else "",
            customer_phone=customer.mobile if customer else None,
            customer_email=customer.email if customer else None,
            vendor_id=booking.vendor_id,
            vendor_name=vendor.full_name if vendor else "",
            business_profile_id=booking.business_profile_id,
            business_name=profile.business_name if profile else "",
            venue_id=booking.venue_id,
            venue_name=venue.venue_name if venue else "",
            venue_city=venue.city if venue else None,
            event_type=booking.event_type,
            booking_type=booking.booking_type,
            booking_mode=booking.booking_mode,
            booking_status=booking.booking_status,
            payment_status=booking.payment_status,
            approval_status=booking.approval_status,
            booking_date=booking.booking_date,
            start_date=booking.start_date,
            end_date=booking.end_date,
            guest_count=booking.guest_count,
            total_amount=float(booking.total_amount),
            paid_amount=float(booking.paid_amount),
            remaining_amount=float(booking.remaining_amount),
            currency=booking.currency,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
        )

    def _to_detail(self, booking: Booking) -> BookingDetailResponse:
        customer = booking.customer
        vendor = booking.vendor
        profile = booking.business_profile
        venue = booking.venue
        return BookingDetailResponse(
            id=booking.id,
            booking_number=booking.booking_number,
            booking_type=booking.booking_type,
            booking_mode=booking.booking_mode,
            event_type=booking.event_type,
            booking_status=booking.booking_status,
            payment_status=booking.payment_status,
            approval_status=booking.approval_status,
            booking_date=booking.booking_date,
            start_date=booking.start_date,
            end_date=booking.end_date,
            guest_count=booking.guest_count,
            special_note=booking.special_note,
            assigned_executive=booking.assigned_executive,
            payment_method=booking.payment_method,
            currency=booking.currency,
            customer=NestedPerson(
                id=customer.id,
                name=customer.full_name,
                email=customer.email,
                phone=customer.mobile,
                city=customer.city,
                code=customer.customer_code,
            )
            if customer
            else NestedPerson(id=booking.customer_id, name=""),
            vendor=NestedPerson(
                id=vendor.id,
                name=vendor.full_name,
                email=vendor.email,
                phone=vendor.mobile,
                code=vendor.owner_code,
            )
            if vendor
            else NestedPerson(id=booking.vendor_id, name=""),
            business_profile=NestedBusiness(
                id=profile.id,
                business_name=profile.business_name,
                business_type=profile.business_type,
            )
            if profile
            else NestedBusiness(id=booking.business_profile_id, business_name=""),
            venue=NestedVenue(
                id=venue.id,
                venue_code=venue.venue_code,
                venue_name=venue.venue_name,
                city=venue.city,
                category=venue.category,
                seating_capacity=venue.seating_capacity,
                maximum_guests=venue.maximum_guests,
            )
            if venue
            else NestedVenue(
                id=booking.venue_id, venue_code="", venue_name=""
            ),
            days=[
                BookingDayResponse(id=d.id, date=d.event_date, status=d.status)
                for d in (booking.days or [])
            ],
            slots=[
                BookingSlotResponse(
                    id=s.id,
                    venue_slot_id=s.venue_slot_id,
                    event_date=s.event_date,
                    slot_key=s.slot_key,
                    slot_name=s.slot_name,
                    slot_price=float(s.slot_price),
                    start_time=s.start_time,
                    end_time=s.end_time,
                    status=s.status,
                )
                for s in (booking.slots or [])
            ],
            food_slots=[
                BookingFoodResponse(
                    id=f.id,
                    food_slot_id=f.food_slot_id,
                    event_date=f.event_date,
                    meal_key=f.meal_key,
                    meal_name=f.meal_name,
                    veg_price=float(f.veg_price),
                    nonveg_price=float(f.nonveg_price),
                    veg_count=f.veg_count,
                    nonveg_count=f.nonveg_count,
                    subtotal=float(f.subtotal),
                    status=f.status,
                )
                for f in (booking.food_items or [])
            ],
            services=[
                BookingServiceResponse(
                    id=s.id,
                    service_name=s.service_name,
                    price=float(s.price),
                    quantity=s.quantity,
                    subtotal=float(s.subtotal),
                )
                for s in (booking.services or [])
            ],
            payment_summary=PaymentSummary(
                subtotal=float(booking.subtotal),
                gst_amount=float(booking.gst_amount),
                discount=float(booking.discount),
                total_amount=float(booking.total_amount),
                advance_percentage=float(booking.advance_percentage),
                advance_amount=float(booking.advance_amount),
                paid_amount=float(booking.paid_amount),
                remaining_amount=float(booking.remaining_amount),
                platform_commission=float(booking.platform_commission),
                vendor_amount=float(booking.vendor_amount),
                currency=booking.currency,
                gst_percent=float(booking.gst_percent),
                gst_mode=booking.gst_mode,
                payment_status=booking.payment_status,
            ),
            invoices=[
                InvoiceResponse(
                    id=i.id,
                    invoice_number=i.invoice_number,
                    invoice_type=i.invoice_type,
                    invoice_status=i.invoice_status,
                    amount=float(i.amount),
                    gst_amount=float(i.gst_amount),
                    pdf_url=i.pdf_url,
                    issued_at=i.issued_at,
                    created_at=i.created_at,
                )
                for i in (booking.invoices or [])
            ],
            payments=[
                PaymentResponse(
                    id=p.id,
                    invoice_number=p.invoice_number,
                    payment_reference=p.payment_reference,
                    transaction_id=p.transaction_id,
                    gateway=p.gateway,
                    amount=float(p.amount),
                    payment_type=p.payment_type,
                    status=p.status,
                    paid_at=p.paid_at,
                    remarks=p.remarks,
                    collected_by=p.collected_by,
                    created_at=p.created_at,
                )
                for p in (booking.payments or [])
            ],
            timeline=[
                TimelineItem(
                    id=a.id,
                    action=a.action,
                    description=a.description,
                    created_by=a.created_by,
                    created_at=a.created_at,
                )
                for a in (booking.activities or [])
            ],
            created_at=booking.created_at,
            updated_at=booking.updated_at,
            created_by=booking.created_by,
            updated_by=booking.updated_by,
        )

    async def list_bookings(
        self,
        actor: User,
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
    ) -> BookingListResponse:
        scoped_vendor = await self._vendor_id(actor)
        scoped_customer = await self._customer_id(actor)
        rows, total = await self.repo.list_bookings(
            search=search,
            booking_status=booking_status,
            payment_status=payment_status,
            venue_id=venue_id,
            customer_id=scoped_customer or customer_id,
            vendor_id=scoped_vendor or vendor_id,
            business_profile_id=business_profile_id,
            event_date=event_date,
            date_from=date_from,
            date_to=date_to,
            assigned_executive=assigned_executive,
            sort_by=sort_by,
            sort_dir=sort_dir,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return BookingListResponse(
            items=[self._to_list_item(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_booking(self, actor: User, booking_id: uuid.UUID) -> BookingDetailResponse:
        booking = await self._load_booking(actor, booking_id)
        return self._to_detail(booking)

    async def _resolve_customer(self, actor: User, customer_id: uuid.UUID | None):
        scoped = await self._customer_id(actor)
        if scoped:
            customer = await self.customers.get_by_id(scoped)
            if customer is None:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND, detail="Customer not found."
                )
            return customer
        if customer_id is None:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="customer_id is required.",
            )
        customer = await self.customers.get_by_id(customer_id)
        if customer is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Customer not found."
            )
        return customer

    def _validate_quote(self, venue: Venue, quote: BookingQuote, guest_count: int) -> None:
        if not quote.dates:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="At least one booking date is required.",
            )
        if not quote.slots:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Select a valid venue slot.",
            )
        if quote.booking_type == "venue_food" and not quote.foods:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Select at least one food slot for venue + food bookings.",
            )
        capacity = self._capacity(venue)
        if capacity and guest_count > capacity:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Guest count exceeds venue capacity.",
            )

    async def _hold_availability(
        self,
        actor: User,
        venue: Venue,
        booking: Booking,
        quote: BookingQuote,
    ) -> uuid.UUID | None:
        first_day_id = None
        seen_food: set[tuple[date, uuid.UUID]] = set()
        for item in quote.slots:
            food = next(
                (
                    f
                    for f in quote.foods
                    if f.event_date == item.event_date
                    and (f.event_date, f.food.id) not in seen_food
                ),
                None,
            )
            payload = BookingHoldRequest(
                event_date=item.event_date,
                slot_id=item.slot.id,
                slot_key=item.slot.slot_key,
                food_slot_id=food.food.id if food else None,
                booking_id=booking.id,
                booking_ref=booking.booking_number,
                customer_name=booking.customer.full_name if booking.customer else None,
                event_type=booking.event_type,
                guests=booking.guest_count,
            )
            if food:
                seen_food.add((food.event_date, food.food.id))
            await self.availability.reserve(
                actor,
                venue.id,
                payload,
                commit=False,
                skip_write_check=True,
            )
            day = await self.availability_days.get_day(venue.id, item.event_date)
            if day is not None and first_day_id is None:
                first_day_id = day.id
        for food in quote.foods:
            key = (food.event_date, food.food.id)
            if key in seen_food:
                continue
            payload = BookingHoldRequest(
                event_date=food.event_date,
                food_slot_id=food.food.id,
                booking_id=booking.id,
                booking_ref=booking.booking_number,
                customer_name=booking.customer.full_name if booking.customer else None,
                event_type=booking.event_type,
                guests=booking.guest_count,
            )
            await self.availability.hold_food_slot(
                venue.id, food.event_date, food.food.id, payload, commit=False
            )
            seen_food.add(key)
        return first_day_id

    async def _assert_bookable_venue(self, actor: User, venue: Venue) -> None:
        if self._scope(actor) == DataScope.VENDOR_OWNED:
            vendor_id = await self._vendor_id(actor)
            profile = venue.business_profile
            owner = profile.venue_owner if profile else None
            if owner is None or owner.id != vendor_id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="You can only book your own venues.",
                )
        if self._scope(actor) == DataScope.CUSTOMER_OWNED:
            if (
                venue.venue_status != VenueStatus.PUBLISHED.value
                or venue.approval_status != "approved"
            ):
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Venue is not available for booking.",
                )

    async def quote_booking(
        self, actor: User, payload: BookingCreateRequest
    ) -> BookingQuoteResponse:
        venue = await self._load_venue(payload.venue_id)
        await self._assert_bookable_venue(actor, venue)
        pricing = venue.active_pricing()
        if pricing is None:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Venue pricing is not configured.",
            )
        booking_type = payload.booking_type or pricing.pricing_type or "venue_only"
        booking_mode = payload.booking_mode or pricing.pricing_mode or "full_day"
        dates = payload.selected_dates or [payload.event_date]
        quote = self.quotes.build(
            venue,
            pricing,
            dates=dates,
            booking_type=booking_type,
            booking_mode=booking_mode,
            slot_ids=payload.slot_ids,
            slot_keys=payload.slot_keys,
            food_slots=payload.food_slots,
            services=payload.services,
            discount=payload.discount or Decimal("0"),
        )
        summary = quote.summary
        if summary is None:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Unable to calculate booking price.",
            )
        return BookingQuoteResponse(
            venue_price=float(summary.venue_price),
            food_cost=float(summary.food_total),
            services_total=float(quote.service_total),
            subtotal=float(summary.subtotal),
            gst_amount=float(summary.gst_extra),
            discount=float(payload.discount or 0),
            grand_total=float(summary.booking_total),
            advance=float(summary.advance_payable),
            remaining=float(summary.remaining_balance),
            commission=float(summary.platform_commission),
            vendor_amount=float(summary.vendor_receivable),
            gst_percent=float(summary.gst_percent),
            advance_percent=float(summary.advance_percent),
        )

    async def create_booking(
        self, actor: User, payload: BookingCreateRequest
    ) -> BookingMutationResponse:
        venue = await self._load_venue(payload.venue_id)
        await self._assert_bookable_venue(actor, venue)
        pricing = venue.active_pricing()
        if pricing is None:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Venue pricing is not configured.",
            )
        customer = await self._resolve_customer(actor, payload.customer_id)
        profile = venue.business_profile
        if profile is None:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Venue business profile is missing.",
            )
        booking_type = payload.booking_type or pricing.pricing_type or "venue_only"
        booking_mode = payload.booking_mode or pricing.pricing_mode or "full_day"
        dates = payload.selected_dates or [payload.event_date]
        quote = self.quotes.build(
            venue,
            pricing,
            dates=dates,
            booking_type=booking_type,
            booking_mode=booking_mode,
            slot_ids=payload.slot_ids,
            slot_keys=payload.slot_keys,
            food_slots=payload.food_slots,
            services=payload.services,
            discount=payload.discount or Decimal("0"),
        )
        self._validate_quote(venue, quote, payload.guest_count)
        if await self.repo.has_duplicate(
            venue_id=venue.id,
            customer_id=customer.id,
            start_date=dates[0],
            slot_ids=[item.slot.id for item in quote.slots],
        ):
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="A matching booking already exists for this date and slot.",
            )
        await self.generator.generate_for_venue(
            venue.id, performed_by=actor.id, fill_missing_only=True
        )
        summary = quote.summary
        assert summary is not None
        confirmation = (pricing.booking_confirmation or "manual").lower()
        requested = payload.booking_status
        if requested == BookingStatus.DRAFT.value:
            status_value = BookingStatus.DRAFT.value
            approval = ApprovalStatus.PENDING.value
        elif confirmation == "automatic" or requested == BookingStatus.CONFIRMED.value:
            status_value = BookingStatus.CONFIRMED.value
            approval = ApprovalStatus.APPROVED.value
        else:
            status_value = requested or BookingStatus.PENDING.value
            approval = ApprovalStatus.PENDING.value
        booking = Booking(
            id=uuid.uuid4(),
            tenant_id=venue.tenant_id,
            booking_number=await self.repo.next_booking_number(),
            customer_id=customer.id,
            vendor_id=profile.venue_owner_id,
            business_profile_id=profile.id,
            venue_id=venue.id,
            pricing_id=pricing.id,
            booking_type=booking_type,
            booking_mode=booking_mode,
            event_type=payload.event_type,
            booking_status=status_value,
            payment_status=PaymentStatus.PENDING.value,
            approval_status=approval,
            booking_date=date.today(),
            start_date=dates[0],
            end_date=dates[-1],
            guest_count=payload.guest_count,
            special_note=payload.special_note,
            selected_slot_ids=[str(item.slot.id) for item in quote.slots],
            selected_food_slots=[
                {
                    "food_slot_id": str(item.food.id),
                    "meal_key": item.food.meal_key,
                    "veg_count": item.veg_count,
                    "nonveg_count": item.nonveg_count,
                }
                for item in quote.foods
            ],
            selected_services=[
                {"name": item.name, "price": float(item.price), "quantity": item.quantity}
                for item in quote.services
            ],
            subtotal=summary.subtotal,
            gst_amount=summary.gst_extra,
            discount=payload.discount or Decimal("0"),
            advance_percentage=summary.advance_percent,
            advance_amount=summary.advance_payable,
            remaining_amount=summary.remaining_balance,
            total_amount=summary.booking_total,
            platform_commission=summary.platform_commission,
            vendor_amount=summary.vendor_receivable,
            paid_amount=Decimal("0"),
            currency="INR",
            gst_percent=summary.gst_percent,
            gst_mode=pricing.gst_mode or "excluded",
            assigned_executive=payload.assigned_executive,
            payment_method=payload.payment_method,
            created_by=actor.id,
            updated_by=actor.id,
        )
        booking.customer = customer
        booking.vendor = profile.venue_owner
        booking.business_profile = profile
        booking.venue = venue
        booking.days = [new_day(booking.id, event_date) for event_date in dates]
        booking.slots = [
            BookingSlot(
                id=uuid.uuid4(),
                booking_id=booking.id,
                venue_slot_id=item.slot.id,
                event_date=item.event_date,
                slot_key=item.slot.slot_key,
                slot_name=item.slot.slot_name,
                slot_price=item.price,
                start_time=start,
                end_time=end,
                status="booked",
            )
            for item in quote.slots
            for start, end in [self.quotes.slot_clocks(item.slot)]
        ]
        booking.food_items = [
            BookingFood(
                id=uuid.uuid4(),
                booking_id=booking.id,
                food_slot_id=item.food.id,
                event_date=item.event_date,
                meal_key=item.food.meal_key,
                meal_name=item.food.meal_name,
                veg_price=item.food.veg_plate_price,
                nonveg_price=item.food.non_veg_plate_price,
                veg_count=item.veg_count,
                nonveg_count=item.nonveg_count,
                subtotal=item.subtotal,
                status="booked",
            )
            for item in quote.foods
        ]
        booking.services = [
            BookingServiceItem(
                id=uuid.uuid4(),
                booking_id=booking.id,
                service_name=item.name,
                price=item.price,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )
            for item in quote.services
        ]
        await self.repo.create(booking)
        if status_value != BookingStatus.DRAFT.value:
            booking.availability_id = await self._hold_availability(actor, venue, booking, quote)
        invoice = Invoice(
            id=uuid.uuid4(),
            booking_id=booking.id,
            invoice_number=await self.repo.next_invoice_number(booking.booking_number),
            invoice_type=InvoiceType.BOOKING.value,
            invoice_status=InvoiceStatus.GENERATED.value,
            amount=summary.booking_total,
            gst_amount=summary.gst_extra,
            created_by=actor.id,
        )
        await self.repo.add_invoice(invoice)
        await self.repo.add_activity(
            booking.id,
            "created",
            f"Booking {booking.booking_number} created.",
            actor.id,
        )
        await self.repo.add_activity(
            booking.id,
            "invoice",
            f"Invoice {invoice.invoice_number} generated.",
            actor.id,
        )
        await self.db.commit()
        booking = await self.repo.get_by_id(booking.id)
        assert booking is not None
        return BookingMutationResponse(
            message="Booking created successfully.",
            booking=self._to_detail(booking),
        )

    async def update_booking(
        self, actor: User, booking_id: uuid.UUID, payload: BookingUpdateRequest
    ) -> BookingMutationResponse:
        booking = await self._load_booking(actor, booking_id)
        if self._scope(actor) == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot update bookings. Cancel and create a new one.",
            )
        if booking.booking_status in {
            BookingStatus.CANCELLED.value,
            BookingStatus.COMPLETED.value,
            BookingStatus.REFUNDED.value,
            BookingStatus.REJECTED.value,
        }:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="This booking can no longer be updated.",
            )
        data = payload.model_dump(exclude_unset=True)
        if "notes" in data and "special_note" not in data:
            booking.special_note = data["notes"]
        for key in ("event_type", "guest_count", "special_note", "assigned_executive", "payment_method"):
            if key in data and data[key] is not None:
                setattr(booking, key, data[key])
        if payload.discount is not None:
            booking.discount = payload.discount
        if payload.booking_status:
            booking.booking_status = payload.booking_status
        booking.updated_by = actor.id
        await self.repo.add_activity(booking.id, "updated", "Booking details updated.", actor.id)
        await self.db.commit()
        booking = await self.repo.get_by_id(booking.id)
        assert booking is not None
        return BookingMutationResponse(message="Booking updated.", booking=self._to_detail(booking))

    async def cancel_booking(
        self, actor: User, booking_id: uuid.UUID, payload: CancelRequest | None = None
    ) -> MessageResponse:
        booking = await self._load_booking(actor, booking_id)
        if booking.booking_status in {
            BookingStatus.CANCELLED.value,
            BookingStatus.COMPLETED.value,
            BookingStatus.REFUNDED.value,
        }:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Booking cannot be cancelled.",
            )
        await self.availability.release(booking.id, actor, commit=False)
        booking.booking_status = BookingStatus.CANCELLED.value
        booking.updated_by = actor.id
        reason = payload.reason if payload else None
        await self.repo.add_activity(
            booking.id,
            "cancelled",
            reason or f"Booking {booking.booking_number} cancelled.",
            actor.id,
        )
        await self.db.commit()
        return MessageResponse(message="Booking cancelled.")

    async def approve_booking(
        self, actor: User, booking_id: uuid.UUID
    ) -> BookingMutationResponse:
        if self._scope(actor) == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot approve bookings.",
            )
        booking = await self._load_booking(actor, booking_id)
        booking.approval_status = ApprovalStatus.APPROVED.value
        if booking.booking_status in {BookingStatus.DRAFT.value, BookingStatus.PENDING.value}:
            booking.booking_status = BookingStatus.CONFIRMED.value
        booking.updated_by = actor.id
        await self.repo.add_activity(
            booking.id, "status", f"Booking {booking.booking_number} approved.", actor.id
        )
        await self.db.commit()
        booking = await self.repo.get_by_id(booking.id)
        assert booking is not None
        return BookingMutationResponse(message="Booking approved.", booking=self._to_detail(booking))

    async def reject_booking(
        self, actor: User, booking_id: uuid.UUID, payload: RejectRequest | None = None
    ) -> BookingMutationResponse:
        if self._scope(actor) == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot reject bookings.",
            )
        booking = await self._load_booking(actor, booking_id)
        await self.availability.release(booking.id, actor, commit=False)
        booking.approval_status = ApprovalStatus.REJECTED.value
        booking.booking_status = BookingStatus.REJECTED.value
        booking.updated_by = actor.id
        reason = payload.reason if payload else None
        await self.repo.add_activity(
            booking.id,
            "status",
            reason or f"Booking {booking.booking_number} rejected.",
            actor.id,
        )
        await self.db.commit()
        booking = await self.repo.get_by_id(booking.id)
        assert booking is not None
        return BookingMutationResponse(message="Booking rejected.", booking=self._to_detail(booking))

    def _refresh_payment_status(self, booking: Booking) -> None:
        paid = Decimal(booking.paid_amount or 0)
        total = Decimal(booking.total_amount or 0)
        if paid <= 0:
            booking.payment_status = PaymentStatus.PENDING.value
            booking.remaining_amount = total
            return
        if paid >= total:
            booking.payment_status = PaymentStatus.PAID.value
            booking.remaining_amount = Decimal("0")
            booking.paid_amount = total
            for invoice in booking.invoices or []:
                invoice.invoice_status = InvoiceStatus.PAID.value
            return
        booking.payment_status = PaymentStatus.PARTIAL.value
        booking.remaining_amount = max(total - paid, Decimal("0"))

    async def record_payment(
        self, actor: User, booking_id: uuid.UUID, payload: PaymentCreateRequest
    ) -> BookingMutationResponse:
        if self._scope(actor) == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot record payments from this endpoint.",
            )
        booking = await self._load_booking(actor, booking_id)
        amount = Decimal(payload.amount)
        invoice = booking.invoices[0] if booking.invoices else None
        payment = Payment(
            id=uuid.uuid4(),
            booking_id=booking.id,
            invoice_id=invoice.id if invoice else None,
            invoice_number=invoice.invoice_number if invoice else None,
            payment_reference=f"PAY-{uuid.uuid4().hex[:10].upper()}",
            transaction_id=payload.transaction_id,
            gateway=payload.gateway or payload.payment_method,
            amount=amount,
            payment_type=payload.payment_type,
            status=PaymentRecordStatus.SUCCESS.value,
            paid_at=payload.paid_at or datetime.now(UTC),
            remarks=payload.remarks,
            collected_by=payload.collected_by,
            created_by=actor.id,
        )
        await self.repo.add_payment(payment)
        booking.payments.append(payment)
        booking.paid_amount = Decimal(booking.paid_amount or 0) + amount
        booking.payment_method = payload.payment_method or booking.payment_method
        booking.updated_by = actor.id
        self._refresh_payment_status(booking)
        await self.repo.add_activity(
            booking.id,
            "payment",
            f"Payment {payment.payment_reference} of {float(amount)} recorded.",
            actor.id,
        )
        await self.db.commit()
        booking = await self.repo.get_by_id(booking.id)
        assert booking is not None
        return BookingMutationResponse(message="Payment recorded.", booking=self._to_detail(booking))

    async def generate_invoice(
        self, actor: User, booking_id: uuid.UUID
    ) -> BookingMutationResponse:
        if self._scope(actor) == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot generate invoices.",
            )
        booking = await self._load_booking(actor, booking_id)
        invoice = Invoice(
            id=uuid.uuid4(),
            booking_id=booking.id,
            invoice_number=await self.repo.next_invoice_number(booking.booking_number),
            invoice_type=InvoiceType.INSTALLMENT.value
            if booking.paid_amount and booking.paid_amount > 0
            else InvoiceType.BOOKING.value,
            invoice_status=InvoiceStatus.GENERATED.value,
            amount=booking.total_amount,
            gst_amount=booking.gst_amount,
            created_by=actor.id,
        )
        await self.repo.add_invoice(invoice)
        booking.invoices.append(invoice)
        await self.repo.add_activity(
            booking.id, "invoice", f"Invoice {invoice.invoice_number} generated.", actor.id
        )
        await self.db.commit()
        booking = await self.repo.get_by_id(booking.id)
        assert booking is not None
        return BookingMutationResponse(message="Invoice generated.", booking=self._to_detail(booking))

    async def check_availability(
        self, actor: User, venue_id: uuid.UUID, event_date: date
    ) -> AvailabilityCheckResponse:
        _ = actor
        venue = await self._load_venue(venue_id)
        await self.generator.generate_for_venue(
            venue.id, performed_by=actor.id, fill_missing_only=True
        )
        await self.db.commit()
        day = await self.availability_days.get_day(venue.id, event_date)
        if day is None:
            return AvailabilityCheckResponse(
                venue_id=venue.id,
                date=event_date,
                day_status="unavailable",
                bookable=False,
            )
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
        remaining: list[RemainingSlot] = []
        remaining_food: list[RemainingSlot] = []
        for slot in day.slots or []:
            start, end = parse_time_range(slot.time_label)
            item = RemainingSlot(
                slot_id=slot.slot_id,
                food_slot_id=slot.food_slot_id,
                slot_key=slot.slot_key,
                slot_name=slot.slot_name,
                slot_kind=slot.slot_kind,
                status=slot.status,
                start_time=format_clock(start) if start else None,
                end_time=format_clock(end) if end else None,
                price=(
                    slot_prices.get(slot.slot_id)
                    if slot.slot_id
                    else food_prices.get(slot.food_slot_id)
                    if slot.food_slot_id
                    else None
                ),
            )
            if slot.slot_kind == "food":
                if slot.status == "available":
                    remaining_food.append(item)
            elif slot.status == "available":
                remaining.append(item)
        bookable = day.status in {"available", "partially_booked"} and bool(
            remaining or remaining_food or day.status == "available"
        )
        if day.status in {"booked", "blocked", "holiday", "closed", "completed"}:
            bookable = False
        return AvailabilityCheckResponse(
            venue_id=venue.id,
            date=event_date,
            day_status=day.status,
            bookable=bookable,
            remaining_slots=remaining,
            remaining_food_slots=remaining_food,
        )

    async def calendar(
        self,
        actor: User,
        *,
        venue_id: uuid.UUID | None,
        month: str | None,
        year: int | None,
        month_number: int | None,
    ) -> BookingCalendarResponse:
        today = date.today()
        if month:
            y, m = month.split("-")
            year, month_number = int(y), int(m)
        year = year or today.year
        month_number = month_number or today.month
        start, end = month_bounds(year, month_number)
        scoped_vendor = await self._vendor_id(actor)
        scoped_customer = await self._customer_id(actor)
        days = []
        if venue_id:
            await self.generator.generate_for_venue(
                venue_id, performed_by=actor.id, fill_missing_only=True
            )
            await self.db.commit()
            rows = await self.availability_days.list_range(venue_id, start, end)
            days = [
                {
                    "date": row.availability_date.isoformat(),
                    "status": row.status,
                    "booking_count": len({s.booking_id for s in (row.slots or []) if s.booking_id}),
                }
                for row in rows
            ]
        bookings = await self.repo.list_for_calendar(
            start=start,
            end=end,
            venue_id=venue_id,
            vendor_id=scoped_vendor,
            customer_id=scoped_customer,
        )
        items: list[CalendarBookingItem] = []
        for booking in bookings:
            for day in booking.days or []:
                if start <= day.event_date <= end:
                    items.append(
                        CalendarBookingItem(
                            id=booking.id,
                            booking_number=booking.booking_number,
                            customer_name=booking.customer.full_name if booking.customer else "",
                            venue_id=booking.venue_id,
                            venue_name=booking.venue.venue_name if booking.venue else "",
                            event_date=day.event_date,
                            booking_status=booking.booking_status,
                            payment_status=booking.payment_status,
                            slot_names=[s.slot_name for s in (booking.slots or [])],
                            total_amount=float(booking.total_amount),
                        )
                    )
        return BookingCalendarResponse(
            venue_id=venue_id,
            month=f"{year:04d}-{month_number:02d}",
            days=days,
            bookings=items,
        )
