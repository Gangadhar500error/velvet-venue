import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions_catalog import (
    VENUE_APPROVE,
    VENUE_CREATE,
    VENUE_DELETE,
    VENUE_REJECT,
    VENUE_UPDATE,
    VENUE_VIEW,
)
from app.db.session import get_db
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.schemas.pricing import PricingMutationResponse, PricingWriteRequest
from app.schemas.venue import (
    BookingPreviewRequest,
    BookingPreviewResponse,
    DocumentResponse,
    GalleryItemResponse,
    MessageResponse,
    PricingResponse,
    SortByLiteral,
    SortDirLiteral,
    VenueCreateRequest,
    VenueDetailResponse,
    VenueListResponse,
    VenueMutationResponse,
    VenueSearchResponse,
    VenueUpdateRequest,
)
from app.services.pricing_service import PricingService
from app.services.venue_service import VenueService

router = APIRouter(prefix="/venues", tags=["Venues"])


def get_venue_service(db: AsyncSession = Depends(get_db)) -> VenueService:
    return VenueService(db)


def get_pricing_service(db: AsyncSession = Depends(get_db)) -> PricingService:
    return PricingService(db)


@router.get("", response_model=VenueListResponse)
async def list_venues(
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    approval_status: str | None = Query(default=None),
    category: str | None = Query(default=None),
    venue_type: str | None = Query(default=None),
    city: str | None = Query(default=None),
    business_profile_id: uuid.UUID | None = Query(default=None),
    sort_by: SortByLiteral = Query(default="venue_name"),
    sort_dir: SortDirLiteral = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> VenueListResponse:
    return await service.list_venues(
        current_user,
        search=search,
        venue_status=status_filter,
        approval_status=approval_status,
        category=category,
        venue_type=venue_type,
        city=city,
        business_profile_id=business_profile_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )


@router.get("/search", response_model=VenueSearchResponse)
async def search_venues(
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
) -> VenueSearchResponse:
    return await service.search_bookable_venues(
        current_user, query=q, page=page, page_size=limit
    )


@router.get("/meta")
async def venue_meta(
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> dict:
    return await service.list_meta(current_user)


@router.get("/{venue_id}", response_model=VenueDetailResponse)
async def get_venue(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> VenueDetailResponse:
    return await service.get_venue(current_user, venue_id)


@router.post("", response_model=VenueMutationResponse, status_code=status.HTTP_201_CREATED)
async def create_venue(
    payload: VenueCreateRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_CREATE.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> VenueMutationResponse:
    return await service.create_venue(current_user, payload)


@router.put("/{venue_id}", response_model=VenueMutationResponse)
async def update_venue(
    venue_id: uuid.UUID,
    payload: VenueUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> VenueMutationResponse:
    return await service.update_venue(current_user, venue_id, payload)


@router.delete("/{venue_id}", response_model=MessageResponse)
async def delete_venue(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_DELETE.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> MessageResponse:
    return await service.delete_venue(current_user, venue_id)


@router.get("/{venue_id}/pricing", response_model=PricingResponse)
async def get_venue_pricing(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> PricingResponse:
    return await service.get_venue_pricing(current_user, venue_id)


@router.post(
    "/{venue_id}/pricing",
    response_model=PricingMutationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_venue_pricing(
    venue_id: uuid.UUID,
    payload: PricingWriteRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> PricingMutationResponse:
    return await service.create_venue_pricing(current_user, venue_id, payload)


@router.get("/{venue_id}/gallery")
async def get_venue_gallery(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> dict:
    items = await service.get_gallery(current_user, venue_id)
    return {"success": True, "items": items}


@router.get("/{venue_id}/documents")
async def get_venue_documents(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> dict:
    items = await service.get_documents(current_user, venue_id)
    return {"success": True, "items": items}


@router.post(
    "/{venue_id}/pricing/preview",
    response_model=BookingPreviewResponse,
)
async def preview_booking(
    venue_id: uuid.UUID,
    payload: BookingPreviewRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> BookingPreviewResponse:
    return await service.preview_booking(current_user, venue_id, payload)


@router.post(
    "/{venue_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
    file: UploadFile = File(...),
    document_type: str = Form(...),
    name: str | None = Form(default=None),
) -> DocumentResponse:
    return await service.upload_document(
        current_user,
        venue_id,
        document_type=document_type,
        name=name,
        upload=file,
    )


@router.post(
    "/{venue_id}/gallery",
    response_model=GalleryItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_gallery(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
    file: UploadFile = File(...),
    image_type: str = Form(default="gallery"),
) -> GalleryItemResponse:
    return await service.upload_gallery(
        current_user, venue_id, image_type=image_type, upload=file
    )


@router.delete("/{venue_id}/documents/{document_id}", response_model=MessageResponse)
async def delete_document(
    venue_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> MessageResponse:
    return await service.delete_document(current_user, venue_id, document_id)


@router.delete("/{venue_id}/gallery/{item_id}", response_model=MessageResponse)
async def delete_gallery_item(
    venue_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> MessageResponse:
    return await service.delete_gallery_item(current_user, venue_id, item_id)


@router.post("/{venue_id}/approve", response_model=VenueMutationResponse)
async def approve_venue(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_APPROVE.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
) -> VenueMutationResponse:
    return await service.approve_venue(current_user, venue_id)


@router.post("/{venue_id}/reject", response_model=VenueMutationResponse)
async def reject_venue(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_REJECT.code))],
    service: Annotated[VenueService, Depends(get_venue_service)],
    reason: str | None = Query(default=None),
) -> VenueMutationResponse:
    return await service.reject_venue(current_user, venue_id, reason=reason)
