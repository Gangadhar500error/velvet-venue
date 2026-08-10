import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions_catalog import (
    VENDOR_CREATE,
    VENDOR_DELETE,
    VENDOR_UPDATE,
    VENDOR_VIEW,
)
from app.db.session import get_db
from app.dependencies.auth import get_current_active_user
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.schemas.venue_owner import (
    MessageResponse,
    SortByLiteral,
    SortDirLiteral,
    VenueOwnerCreateRequest,
    VenueOwnerDetailResponse,
    VenueOwnerListResponse,
    VenueOwnerMutationResponse,
    VenueOwnerUpdateRequest,
)
from app.services.venue_owner_service import VenueOwnerService

router = APIRouter(prefix="/venue-owners", tags=["Venue Owners"])


def get_venue_owner_service(db: AsyncSession = Depends(get_db)) -> VenueOwnerService:
    return VenueOwnerService(db)


@router.get("", response_model=VenueOwnerListResponse)
async def list_venue_owners(
    current_user: Annotated[User, Depends(require_permission(VENDOR_VIEW.code))],
    service: Annotated[VenueOwnerService, Depends(get_venue_owner_service)],
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    registration_source: str | None = Query(default=None),
    verification_status: str | None = Query(default=None),
    city: str | None = Query(default=None),
    business_type: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    sort_by: SortByLiteral = Query(default="name"),
    sort_dir: SortDirLiteral = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> VenueOwnerListResponse:
    return await service.list_owners(
        current_user,
        search=search,
        status_filter=status_filter,
        registration_source=registration_source,
        verification_status=verification_status,
        city=city,
        business_type=business_type,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )


@router.get("/me", response_model=VenueOwnerDetailResponse)
async def get_my_venue_owner_profile(
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[VenueOwnerService, Depends(get_venue_owner_service)],
) -> VenueOwnerDetailResponse:
    return await service.get_my_profile(current_user)


@router.get("/meta/cities")
async def list_venue_owner_cities(
    current_user: Annotated[User, Depends(require_permission(VENDOR_VIEW.code))],
    service: Annotated[VenueOwnerService, Depends(get_venue_owner_service)],
) -> dict:
    return {"success": True, "items": await service.list_cities(current_user)}


@router.get("/{owner_id}", response_model=VenueOwnerDetailResponse)
async def get_venue_owner(
    owner_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENDOR_VIEW.code))],
    service: Annotated[VenueOwnerService, Depends(get_venue_owner_service)],
) -> VenueOwnerDetailResponse:
    return await service.get_owner(current_user, owner_id)


@router.post(
    "",
    response_model=VenueOwnerMutationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_venue_owner(
    payload: VenueOwnerCreateRequest,
    current_user: Annotated[User, Depends(require_permission(VENDOR_CREATE.code))],
    service: Annotated[VenueOwnerService, Depends(get_venue_owner_service)],
) -> VenueOwnerMutationResponse:
    return await service.create_owner(current_user, payload)


@router.put("/{owner_id}", response_model=VenueOwnerMutationResponse)
async def update_venue_owner(
    owner_id: uuid.UUID,
    payload: VenueOwnerUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(VENDOR_UPDATE.code))],
    service: Annotated[VenueOwnerService, Depends(get_venue_owner_service)],
) -> VenueOwnerMutationResponse:
    return await service.update_owner(current_user, owner_id, payload)


@router.delete("/{owner_id}", response_model=MessageResponse)
async def delete_venue_owner(
    owner_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENDOR_DELETE.code))],
    service: Annotated[VenueOwnerService, Depends(get_venue_owner_service)],
) -> MessageResponse:
    return await service.delete_owner(current_user, owner_id)
