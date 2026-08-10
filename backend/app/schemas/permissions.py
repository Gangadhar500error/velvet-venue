import uuid

from pydantic import BaseModel, ConfigDict, Field


class MenuItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str
    href: str | None = None
    icon: str | None = None
    permission_code: str | None = None
    children: list["MenuItemResponse"] = Field(default_factory=list)


class MenusResponse(BaseModel):
    success: bool = True
    items: list[MenuItemResponse]


class DashboardResponse(BaseModel):
    success: bool = True
    portal: str
    widgets: list[str]


class AccessConfigResponse(BaseModel):
    success: bool = True
    portal: str
    permissions: list[str]
    route_permissions: dict[str, str]
    data_scope: str


class PermissionCheckResponse(BaseModel):
    success: bool = True
    permission: str
    allowed: bool
