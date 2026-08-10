import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.permissions_catalog import (
    CUSTOMER_CREATE,
    CUSTOMER_DELETE,
    CUSTOMER_UPDATE,
    CUSTOMER_VIEW,
)
from app.dependencies.auth import get_current_active_user
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.schemas.customer import (
    CustomerCreateRequest,
    CustomerDetailResponse,
    CustomerListResponse,
    CustomerMutationResponse,
    CustomerUpdateRequest,
    FindOrCreateCustomerRequest,
    MessageResponse,
    SortByLiteral,
    SortDirLiteral,
)
from app.services.customer_service import CustomerService
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/customers", tags=["Customers"])


def get_customer_service(db: AsyncSession = Depends(get_db)) -> CustomerService:
    return CustomerService(db)


@router.get(
    "",
    response_model=CustomerListResponse,
    summary="List customers with pagination, search, filters, and sorting",
)
async def list_customers(
    current_user: Annotated[User, Depends(require_permission(CUSTOMER_VIEW.code))],
    service: Annotated[CustomerService, Depends(get_customer_service)],
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    registration_source: str | None = Query(default=None),
    verification_status: str | None = Query(default=None),
    city: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    sort_by: SortByLiteral = Query(default="name"),
    sort_dir: SortDirLiteral = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> CustomerListResponse:
    return await service.list_customers(
        current_user,
        search=search,
        status_filter=status_filter,
        registration_source=registration_source,
        verification_status=verification_status,
        city=city,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/me",
    response_model=CustomerDetailResponse,
    summary="Get the authenticated customer's own profile",
)
async def get_my_customer_profile(
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> CustomerDetailResponse:
    return await service.get_my_profile(current_user)


@router.get(
    "/meta/cities",
    summary="List distinct customer cities for filters",
)
async def list_customer_cities(
    current_user: Annotated[User, Depends(require_permission(CUSTOMER_VIEW.code))],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> dict:
    cities = await service.list_cities(current_user)
    return {"success": True, "items": cities}


@router.post(
    "/find-or-create",
    response_model=CustomerMutationResponse,
    summary="Find an existing customer by email/mobile or create one",
)
async def find_or_create_customer(
    payload: FindOrCreateCustomerRequest,
    current_user: Annotated[User, Depends(require_permission(CUSTOMER_CREATE.code))],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> CustomerMutationResponse:
    return await service.find_or_create(current_user, payload)


@router.get(
    "/{customer_id}",
    response_model=CustomerDetailResponse,
    summary="Get customer details with account overview",
)
async def get_customer(
    customer_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(CUSTOMER_VIEW.code))],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> CustomerDetailResponse:
    return await service.get_customer(current_user, customer_id)


@router.post(
    "",
    response_model=CustomerMutationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a customer (returns existing if email/mobile match)",
)
async def create_customer(
    payload: CustomerCreateRequest,
    current_user: Annotated[User, Depends(require_permission(CUSTOMER_CREATE.code))],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> CustomerMutationResponse:
    return await service.create_customer(current_user, payload)


@router.put(
    "/{customer_id}",
    response_model=CustomerMutationResponse,
    summary="Update customer profile fields",
)
async def update_customer(
    customer_id: uuid.UUID,
    payload: CustomerUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(CUSTOMER_UPDATE.code))],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> CustomerMutationResponse:
    return await service.update_customer(current_user, customer_id, payload)


@router.delete(
    "/{customer_id}",
    response_model=MessageResponse,
    summary="Soft-delete a customer",
)
async def delete_customer(
    customer_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(CUSTOMER_DELETE.code))],
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> MessageResponse:
    return await service.delete_customer(current_user, customer_id)
