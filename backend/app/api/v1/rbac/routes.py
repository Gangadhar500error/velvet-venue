from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.permissions_catalog import (
    BOOKING_VIEW,
    CUSTOMER_VIEW,
    VENUE_CREATE,
    VENUE_VIEW,
)
from app.dependencies.permissions import require_permission
from app.models.user import User

router = APIRouter(prefix="/rbac", tags=["RBAC"])


@router.get("/venues", summary="Demo: requires Venue.View")
async def list_venues(
    current_user: Annotated[User, Depends(require_permission(VENUE_VIEW.code))],
) -> dict:
    scope = "all" if current_user.role.name.value == "admin" else "owned"
    return {
        "success": True,
        "message": f"Venue list accessible ({scope} scope)",
        "data": [],
    }


@router.post("/venues", summary="Demo: requires Venue.Create")
async def create_venue(
    current_user: Annotated[User, Depends(require_permission(VENUE_CREATE.code))],
) -> dict:
    return {"success": True, "message": "Venue creation authorized"}


@router.get("/bookings", summary="Demo: requires Booking.View")
async def list_bookings(
    current_user: Annotated[User, Depends(require_permission(BOOKING_VIEW.code))],
) -> dict:
    scope = "all" if current_user.role.name.value == "admin" else "owned"
    return {
        "success": True,
        "message": f"Booking list accessible ({scope} scope)",
        "data": [],
    }


@router.get("/customers", summary="Demo: requires Customer.View")
async def list_customers(
    current_user: Annotated[User, Depends(require_permission(CUSTOMER_VIEW.code))],
) -> dict:
    scope = "all" if current_user.role.name.value == "admin" else "vendor_owned"
    return {
        "success": True,
        "message": f"Customer list accessible ({scope} scope)",
        "data": [],
    }
