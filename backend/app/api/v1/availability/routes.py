import uuid
from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions_catalog import AVAILABILITY_UPDATE, AVAILABILITY_VIEW, VENUE_VIEW
from app.db.session import get_db
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.schemas.availability import (
    AvailabilityDashboard,
    AvailabilityDayDetailResponse,
    AvailabilityListResponse,
    AvailabilityMonthResponse,
    BlockCreateRequest,
    BlockMutationResponse,
    BlockUpdateRequest,
    MessageResponse,
)
from app.services.availability_service import AvailabilityService

venue_router = APIRouter(prefix="/venues", tags=["Availability"])
block_router = APIRouter(prefix="/availability", tags=["Availability"])


def get_availability_service(db: AsyncSession = Depends(get_db)) -> AvailabilityService:
    return AvailabilityService(db)


@venue_router.get("/{venue_id}/availability", response_model=AvailabilityMonthResponse)
async def get_month_availability(
    venue_id: uuid.UUID,
    current_user: Annotated[
        User, Depends(require_permission(AVAILABILITY_VIEW.code, VENUE_VIEW.code, require_all=False))
    ],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    year: int | None = Query(default=None, ge=2000, le=2100),
    month_number: int | None = Query(default=None, alias="month_number", ge=1, le=12),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
) -> AvailabilityMonthResponse:
    today = date.today()
    if month:
        y, m = month.split("-")
        year, month_number = int(y), int(m)
    if start_date and end_date and (end_date - start_date).days > 400:
        end_date = start_date + timedelta(days=400)
    return await service.month(
        current_user,
        venue_id,
        year or today.year,
        month_number or today.month,
        start=start_date,
        end=end_date,
    )


@venue_router.get("/{venue_id}/availability/list", response_model=AvailabilityListResponse)
async def get_availability_list(
    venue_id: uuid.UUID,
    current_user: Annotated[
        User, Depends(require_permission(AVAILABILITY_VIEW.code, VENUE_VIEW.code, require_all=False))
    ],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    year: int | None = Query(default=None, ge=2000, le=2100),
    status: str | None = Query(default=None),
    slot: str | None = Query(default=None),
    booking_status: str | None = Query(default=None),
    booking_type: str | None = Query(default=None),
    search: str | None = Query(default=None),
    customer: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=31, ge=1, le=400),
) -> AvailabilityListResponse:
    month_number = None
    if month:
        y, m = month.split("-")
        year, month_number = int(y), int(m)
    _ = booking_type
    return await service.list_days(
        current_user,
        venue_id,
        year=year,
        month=month_number,
        status=status,
        slot=slot,
        booking_status=booking_status,
        search=search,
        customer=customer,
        page=page,
        page_size=page_size,
    )


@venue_router.get("/{venue_id}/availability/dashboard", response_model=AvailabilityDashboard)
async def get_availability_dashboard(
    venue_id: uuid.UUID,
    current_user: Annotated[
        User, Depends(require_permission(AVAILABILITY_VIEW.code, VENUE_VIEW.code, require_all=False))
    ],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
) -> AvailabilityDashboard:
    year = month_number = None
    if month:
        y, m = month.split("-")
        year, month_number = int(y), int(m)
    return await service.dashboard(current_user, venue_id, year, month_number)


@venue_router.get("/{venue_id}/availability/blocks")
async def list_availability_blocks(
    venue_id: uuid.UUID,
    current_user: Annotated[
        User, Depends(require_permission(AVAILABILITY_VIEW.code, VENUE_VIEW.code, require_all=False))
    ],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
) -> dict:
    blocks = await service.list_blocks(current_user, venue_id)
    return {"success": True, "items": blocks}


@venue_router.post("/{venue_id}/availability/block", response_model=BlockMutationResponse)
async def create_availability_block(
    venue_id: uuid.UUID,
    payload: BlockCreateRequest,
    current_user: Annotated[User, Depends(require_permission(AVAILABILITY_UPDATE.code))],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
) -> BlockMutationResponse:
    return await service.create_block(current_user, venue_id, payload)


@venue_router.post("/{venue_id}/availability/regenerate", response_model=MessageResponse)
async def regenerate_availability(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(AVAILABILITY_UPDATE.code))],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
) -> MessageResponse:
    return await service.regenerate(current_user, venue_id)


@venue_router.get("/{venue_id}/availability/{availability_date}", response_model=AvailabilityDayDetailResponse)
async def get_availability_day(
    venue_id: uuid.UUID,
    availability_date: date,
    current_user: Annotated[
        User, Depends(require_permission(AVAILABILITY_VIEW.code, VENUE_VIEW.code, require_all=False))
    ],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
) -> AvailabilityDayDetailResponse:
    return await service.day_detail(current_user, venue_id, availability_date)


@block_router.put("/block/{block_id}", response_model=BlockMutationResponse)
async def update_availability_block(
    block_id: uuid.UUID,
    payload: BlockUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(AVAILABILITY_UPDATE.code))],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
) -> BlockMutationResponse:
    return await service.update_block(current_user, block_id, payload)


@block_router.delete("/block/{block_id}", response_model=MessageResponse)
async def delete_availability_block(
    block_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(AVAILABILITY_UPDATE.code))],
    service: Annotated[AvailabilityService, Depends(get_availability_service)],
) -> MessageResponse:
    return await service.delete_block(current_user, block_id)
