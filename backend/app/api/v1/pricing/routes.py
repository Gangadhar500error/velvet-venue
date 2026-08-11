import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions_catalog import VENUE_UPDATE, VENUE_VIEW
from app.db.session import get_db
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.schemas.pricing import (
    FoodSlotMutationResponse,
    FoodSlotWriteRequest,
    MessageResponse,
    PricingDetailResponse,
    PricingMutationResponse,
    PricingPreviewQuery,
    PricingUpdateRequest,
    SlotMutationResponse,
    SlotWriteRequest,
)
from app.schemas.venue import BookingPreviewResponse
from app.services.pricing_service import PricingService

router = APIRouter(prefix="/pricing", tags=["Venue Pricing"])


def get_pricing_service(db: AsyncSession = Depends(get_db)) -> PricingService:
    return PricingService(db)


@router.put("/slots/{slot_id}", response_model=SlotMutationResponse)
async def update_slot(
    slot_id: uuid.UUID,
    payload: SlotWriteRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> SlotMutationResponse:
    return await service.update_slot(current_user, slot_id, payload)


@router.delete("/slots/{slot_id}", response_model=MessageResponse)
async def delete_slot(
    slot_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> MessageResponse:
    return await service.delete_slot(current_user, slot_id)


@router.put("/food-slots/{food_slot_id}", response_model=FoodSlotMutationResponse)
async def update_food_slot(
    food_slot_id: uuid.UUID,
    payload: FoodSlotWriteRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> FoodSlotMutationResponse:
    return await service.update_food_slot(current_user, food_slot_id, payload)


@router.delete("/food-slots/{food_slot_id}", response_model=MessageResponse)
async def delete_food_slot(
    food_slot_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> MessageResponse:
    return await service.delete_food_slot(current_user, food_slot_id)


@router.post(
    "/{pricing_id}/slots",
    response_model=SlotMutationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_slot(
    pricing_id: uuid.UUID,
    payload: SlotWriteRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> SlotMutationResponse:
    return await service.create_slot(current_user, pricing_id, payload)


@router.post(
    "/{pricing_id}/food-slots",
    response_model=FoodSlotMutationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_food_slot(
    pricing_id: uuid.UUID,
    payload: FoodSlotWriteRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> FoodSlotMutationResponse:
    return await service.create_food_slot(current_user, pricing_id, payload)


@router.get("/{pricing_id}/preview", response_model=BookingPreviewResponse)
async def preview_pricing(
    pricing_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
    slot_id: uuid.UUID | None = Query(default=None),
    slot_key: str | None = Query(default=None),
    food_slot_id: uuid.UUID | None = Query(default=None),
    food_meal_key: str | None = Query(default=None),
    guests: int = Query(default=100, ge=1),
    plate_type: str = Query(default="veg"),
) -> BookingPreviewResponse:
    plate = "non_veg" if plate_type == "non_veg" else "veg"
    return await service.preview_pricing(
        current_user,
        pricing_id,
        PricingPreviewQuery(
            slot_id=slot_id,
            slot_key=slot_key,
            food_slot_id=food_slot_id,
            food_meal_key=food_meal_key,
            guests=guests,
            plate_type=plate,
        ),
    )


@router.get("/{pricing_id}", response_model=PricingDetailResponse)
async def get_pricing(
    pricing_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> PricingDetailResponse:
    return await service.get_pricing(current_user, pricing_id)


@router.put("/{pricing_id}", response_model=PricingMutationResponse)
async def update_pricing(
    pricing_id: uuid.UUID,
    payload: PricingUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> PricingMutationResponse:
    return await service.update_pricing(current_user, pricing_id, payload)


@router.delete("/{pricing_id}", response_model=MessageResponse)
async def delete_pricing(
    pricing_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VENUE_UPDATE.code))],
    service: Annotated[PricingService, Depends(get_pricing_service)],
) -> MessageResponse:
    return await service.delete_pricing(current_user, pricing_id)
