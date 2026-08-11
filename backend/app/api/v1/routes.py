from fastapi import APIRouter

from app.api.v1.auth.routes import router as auth_router
from app.api.v1.business_profiles.routes import router as business_profiles_router
from app.api.v1.customers.routes import router as customers_router
from app.api.v1.rbac.routes import router as rbac_router
from app.api.v1.venue_owners.routes import router as venue_owners_router
from app.api.v1.availability.routes import block_router as availability_block_router
from app.api.v1.availability.routes import venue_router as venue_availability_router
from app.api.v1.pricing.routes import router as pricing_router
from app.api.v1.venues.routes import router as venues_router
from app.core.config import get_settings

settings = get_settings()
router = APIRouter(prefix=settings.API_PREFIX, tags=["v1"])
router.include_router(auth_router)
router.include_router(customers_router)
router.include_router(venue_owners_router)
router.include_router(business_profiles_router)
router.include_router(venues_router)
router.include_router(venue_availability_router)
router.include_router(availability_block_router)
router.include_router(pricing_router)
router.include_router(rbac_router)


@router.get("/health")
async def health_check() -> dict:
    return {
        "success": True,
        "message": "Velvet Venues API Running",
        "version": "1.0.0",
    }
