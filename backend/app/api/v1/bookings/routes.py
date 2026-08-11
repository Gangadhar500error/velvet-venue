import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions_catalog import (
    BOOKING_APPROVE,
    BOOKING_CANCEL,
    BOOKING_CREATE,
    BOOKING_DELETE,
    BOOKING_REJECT,
    BOOKING_UPDATE,
    BOOKING_VIEW,
    INVOICE_GENERATE,
    PAYMENT_VIEW,
)
from app.db.session import get_db
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.schemas.booking import (
    AvailabilityCheckResponse,
    BookingCalendarResponse,
    BookingCreateRequest,
    BookingDetailResponse,
    BookingListResponse,
    BookingMutationResponse,
    BookingQuoteResponse,
    BookingUpdateRequest,
    CancelRequest,
    MessageResponse,
    PaymentCreateRequest,
    RejectRequest,
    SortByLiteral,
    SortDirLiteral,
)
from app.services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def get_booking_service(db: AsyncSession = Depends(get_db)) -> BookingService:
    return BookingService(db)


@router.get("", response_model=BookingListResponse)
async def list_bookings(
    current_user: Annotated[User, Depends(require_permission(BOOKING_VIEW.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
    search: str | None = Query(default=None),
    booking_status: str | None = Query(default=None),
    payment_status: str | None = Query(default=None),
    venue_id: uuid.UUID | None = Query(default=None),
    customer_id: uuid.UUID | None = Query(default=None),
    vendor_id: uuid.UUID | None = Query(default=None),
    business_profile_id: uuid.UUID | None = Query(default=None),
    event_date: date | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    assigned_executive: str | None = Query(default=None),
    sort_by: SortByLiteral = Query(default="created_at"),
    sort_dir: SortDirLiteral = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> BookingListResponse:
    return await service.list_bookings(
        current_user,
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
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )


@router.get("/calendar", response_model=BookingCalendarResponse)
async def booking_calendar(
    current_user: Annotated[User, Depends(require_permission(BOOKING_VIEW.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
    venue_id: uuid.UUID | None = Query(default=None),
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    year: int | None = Query(default=None, ge=2000, le=2100),
    month_number: int | None = Query(default=None, ge=1, le=12),
) -> BookingCalendarResponse:
    return await service.calendar(
        current_user,
        venue_id=venue_id,
        month=month,
        year=year,
        month_number=month_number,
    )


@router.get("/availability", response_model=AvailabilityCheckResponse)
async def booking_availability(
    current_user: Annotated[User, Depends(require_permission(BOOKING_VIEW.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
    venue_id: uuid.UUID = Query(...),
    event_date: date = Query(..., alias="date"),
) -> AvailabilityCheckResponse:
    return await service.check_availability(current_user, venue_id, event_date)


@router.get("/vendor", response_model=BookingListResponse)
async def vendor_bookings(
    current_user: Annotated[User, Depends(require_permission(BOOKING_VIEW.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
    search: str | None = Query(default=None),
    booking_status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> BookingListResponse:
    return await service.list_bookings(
        current_user,
        search=search,
        booking_status=booking_status,
        page=page,
        page_size=page_size,
    )


@router.get("/customer", response_model=BookingListResponse)
async def customer_bookings(
    current_user: Annotated[User, Depends(require_permission(BOOKING_VIEW.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
    search: str | None = Query(default=None),
    booking_status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> BookingListResponse:
    return await service.list_bookings(
        current_user,
        search=search,
        booking_status=booking_status,
        page=page,
        page_size=page_size,
    )


@router.post("/quote", response_model=BookingQuoteResponse)
async def quote_booking(
    payload: BookingCreateRequest,
    current_user: Annotated[
        User,
        Depends(require_permission(BOOKING_CREATE.code, BOOKING_UPDATE.code, BOOKING_VIEW.code, require_all=False)),
    ],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingQuoteResponse:
    return await service.quote_booking(current_user, payload)


@router.get("/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(
    booking_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BOOKING_VIEW.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingDetailResponse:
    return await service.get_booking(current_user, booking_id)


@router.post("", response_model=BookingMutationResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: BookingCreateRequest,
    current_user: Annotated[
        User,
        Depends(require_permission(BOOKING_CREATE.code, BOOKING_UPDATE.code, require_all=False)),
    ],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingMutationResponse:
    return await service.create_booking(current_user, payload)


@router.put("/{booking_id}", response_model=BookingMutationResponse)
async def update_booking(
    booking_id: uuid.UUID,
    payload: BookingUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(BOOKING_UPDATE.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingMutationResponse:
    return await service.update_booking(current_user, booking_id, payload)


@router.delete("/{booking_id}", response_model=MessageResponse)
async def cancel_booking(
    booking_id: uuid.UUID,
    current_user: Annotated[
        User,
        Depends(require_permission(BOOKING_CANCEL.code, BOOKING_DELETE.code, require_all=False)),
    ],
    service: Annotated[BookingService, Depends(get_booking_service)],
    payload: CancelRequest | None = None,
) -> MessageResponse:
    return await service.cancel_booking(current_user, booking_id, payload)


@router.post("/{booking_id}/approve", response_model=BookingMutationResponse)
async def approve_booking(
    booking_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BOOKING_APPROVE.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingMutationResponse:
    return await service.approve_booking(current_user, booking_id)


@router.post("/{booking_id}/reject", response_model=BookingMutationResponse)
async def reject_booking(
    booking_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BOOKING_REJECT.code))],
    service: Annotated[BookingService, Depends(get_booking_service)],
    payload: RejectRequest | None = None,
) -> BookingMutationResponse:
    return await service.reject_booking(current_user, booking_id, payload)


@router.post("/{booking_id}/payments", response_model=BookingMutationResponse)
async def record_payment(
    booking_id: uuid.UUID,
    payload: PaymentCreateRequest,
    current_user: Annotated[
        User,
        Depends(require_permission(BOOKING_UPDATE.code, PAYMENT_VIEW.code, require_all=False)),
    ],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingMutationResponse:
    return await service.record_payment(current_user, booking_id, payload)


@router.post("/{booking_id}/invoices", response_model=BookingMutationResponse)
async def generate_invoice(
    booking_id: uuid.UUID,
    current_user: Annotated[
        User,
        Depends(require_permission(BOOKING_UPDATE.code, INVOICE_GENERATE.code, require_all=False)),
    ],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingMutationResponse:
    return await service.generate_invoice(current_user, booking_id)
