from fastapi import APIRouter

from app.api.v1.auth.routes import router as auth_router
from app.api.v1.rbac.routes import router as rbac_router
from app.core.config import get_settings

settings = get_settings()
router = APIRouter(prefix=settings.API_PREFIX, tags=["v1"])
router.include_router(auth_router)
router.include_router(rbac_router)


@router.get("/health")
async def health_check() -> dict:
    return {
        "success": True,
        "message": "Velvet Venues API Running",
        "version": "1.0.0",
    }
