import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions_catalog import (
    BUSINESS_PROFILE_CREATE,
    BUSINESS_PROFILE_DELETE,
    BUSINESS_PROFILE_UPDATE,
    BUSINESS_PROFILE_VIEW,
)
from app.db.session import get_db
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.schemas.business_profile import (
    BusinessProfileCreateRequest,
    BusinessProfileDetailResponse,
    BusinessProfileListResponse,
    BusinessProfileMutationResponse,
    BusinessProfileUpdateRequest,
    DocumentUploadResponse,
    MessageResponse,
    SortByLiteral,
    SortDirLiteral,
)
from app.services.business_profile_service import BusinessProfileService

router = APIRouter(prefix="/business-profiles", tags=["Business Profiles"])


def get_business_profile_service(
    db: AsyncSession = Depends(get_db),
) -> BusinessProfileService:
    return BusinessProfileService(db)


@router.get("", response_model=BusinessProfileListResponse)
async def list_business_profiles(
    current_user: Annotated[User, Depends(require_permission(BUSINESS_PROFILE_VIEW.code))],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    verification_status: str | None = Query(default=None),
    business_type: str | None = Query(default=None),
    city: str | None = Query(default=None),
    venue_owner_id: uuid.UUID | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    sort_by: SortByLiteral = Query(default="business_name"),
    sort_dir: SortDirLiteral = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> BusinessProfileListResponse:
    return await service.list_profiles(
        current_user,
        search=search,
        status_filter=status_filter,
        verification_status=verification_status,
        business_type=business_type,
        city=city,
        venue_owner_id=venue_owner_id,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )


@router.get("/meta/cities")
async def list_business_profile_cities(
    current_user: Annotated[User, Depends(require_permission(BUSINESS_PROFILE_VIEW.code))],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
) -> dict:
    return {"success": True, "items": await service.list_cities(current_user)}


@router.get("/{profile_id}", response_model=BusinessProfileDetailResponse)
async def get_business_profile(
    profile_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BUSINESS_PROFILE_VIEW.code))],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
) -> BusinessProfileDetailResponse:
    return await service.get_profile(current_user, profile_id)


@router.post(
    "",
    response_model=BusinessProfileMutationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_business_profile(
    payload: BusinessProfileCreateRequest,
    current_user: Annotated[
        User, Depends(require_permission(BUSINESS_PROFILE_CREATE.code))
    ],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
) -> BusinessProfileMutationResponse:
    return await service.create_profile(current_user, payload)


@router.put("/{profile_id}", response_model=BusinessProfileMutationResponse)
async def update_business_profile(
    profile_id: uuid.UUID,
    payload: BusinessProfileUpdateRequest,
    current_user: Annotated[
        User, Depends(require_permission(BUSINESS_PROFILE_UPDATE.code))
    ],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
) -> BusinessProfileMutationResponse:
    return await service.update_profile(current_user, profile_id, payload)


@router.delete("/{profile_id}", response_model=MessageResponse)
async def delete_business_profile(
    profile_id: uuid.UUID,
    current_user: Annotated[
        User, Depends(require_permission(BUSINESS_PROFILE_DELETE.code))
    ],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
) -> MessageResponse:
    return await service.delete_profile(current_user, profile_id)


@router.post(
    "/{profile_id}/documents",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_business_document(
    profile_id: uuid.UUID,
    current_user: Annotated[
        User, Depends(require_permission(BUSINESS_PROFILE_UPDATE.code))
    ],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
    file: UploadFile = File(...),
    document_type: str = Form(...),
    name: str | None = Form(default=None),
) -> DocumentUploadResponse:
    return await service.upload_document(
        current_user,
        profile_id,
        document_type=document_type,
        name=name,
        upload=file,
    )


@router.post("/{profile_id}/approve", response_model=BusinessProfileMutationResponse)
async def approve_business_profile(
    profile_id: uuid.UUID,
    current_user: Annotated[
        User, Depends(require_permission(BUSINESS_PROFILE_UPDATE.code))
    ],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
) -> BusinessProfileMutationResponse:
    return await service.approve_profile(current_user, profile_id)


@router.post("/{profile_id}/reject", response_model=BusinessProfileMutationResponse)
async def reject_business_profile(
    profile_id: uuid.UUID,
    current_user: Annotated[
        User, Depends(require_permission(BUSINESS_PROFILE_UPDATE.code))
    ],
    service: Annotated[BusinessProfileService, Depends(get_business_profile_service)],
    reason: str | None = Query(default=None),
) -> BusinessProfileMutationResponse:
    return await service.reject_profile(current_user, profile_id, reason=reason)
