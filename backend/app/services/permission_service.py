import uuid
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.menu_catalog import ROLE_PORTAL_MAP
from app.core.permissions_catalog import (
    DASHBOARD_WIDGETS,
    ROUTE_PERMISSIONS,
    WIDGET_PERMISSIONS,
)
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.schemas.permissions import (
    AccessConfigResponse,
    DashboardResponse,
    MenuItemResponse,
    PermissionCheckResponse,
)


class DataScope(str, Enum):
    ALL = "all"
    VENDOR_OWNED = "vendor_owned"
    CUSTOMER_OWNED = "customer_owned"


class PermissionService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = PermissionRepository(db)

    async def get_user_permissions(self, user: User) -> set[str]:
        loaded = await self.repo.get_user_with_permissions(user.id)
        if loaded is None or loaded.role is None:
            return set()
        return {p.code for p in loaded.role.permissions}

    async def user_has_permission(self, user: User, permission_code: str) -> bool:
        permissions = await self.get_user_permissions(user)
        return permission_code in permissions

    async def user_has_any_permission(self, user: User, *codes: str) -> bool:
        permissions = await self.get_user_permissions(user)
        return any(code in permissions for code in codes)

    async def user_has_all_permissions(self, user: User, *codes: str) -> bool:
        permissions = await self.get_user_permissions(user)
        return all(code in permissions for code in codes)

    def get_portal_for_role(self, role_name: str) -> str:
        return ROLE_PORTAL_MAP.get(role_name, role_name)

    async def get_menus_for_user(self, user: User) -> list[MenuItemResponse]:
        portal = self.get_portal_for_role(user.role.name.value)
        permissions = await self.get_user_permissions(user)
        menus = await self.repo.get_menus_by_portal(portal)

        allowed = [
            m
            for m in menus
            if m.permission_code is None or m.permission_code in permissions
        ]

        children_map: dict[uuid.UUID | None, list] = {}
        for menu in allowed:
            children_map.setdefault(menu.parent_id, []).append(menu)

        def build_tree(parent_id: uuid.UUID | None) -> list[MenuItemResponse]:
            items = sorted(children_map.get(parent_id, []), key=lambda m: (m.sort_order, m.label))
            result: list[MenuItemResponse] = []
            for menu in items:
                children = build_tree(menu.id)
                if menu.href is None and not children:
                    continue
                result.append(
                    MenuItemResponse(
                        id=menu.id,
                        label=menu.label,
                        href=menu.href,
                        icon=menu.icon,
                        permission_code=menu.permission_code,
                        children=children,
                    )
                )
            return result

        return build_tree(None)

    async def get_dashboard_for_user(self, user: User) -> DashboardResponse:
        portal = self.get_portal_for_role(user.role.name.value)
        permissions = await self.get_user_permissions(user)
        widget_keys = DASHBOARD_WIDGETS.get(portal, [])
        widgets = [
            key
            for key in widget_keys
            if WIDGET_PERMISSIONS.get(key) is None
            or WIDGET_PERMISSIONS[key] in permissions
        ]
        return DashboardResponse(portal=portal, widgets=widgets)

    async def get_access_config(self, user: User) -> AccessConfigResponse:
        permissions = sorted(await self.get_user_permissions(user))
        portal = self.get_portal_for_role(user.role.name.value)
        route_map = {
            route: perm
            for route, perm in ROUTE_PERMISSIONS.items()
            if perm in permissions
        }
        return AccessConfigResponse(
            portal=portal,
            permissions=permissions,
            route_permissions=route_map,
            data_scope=self.get_data_scope(user).value,
        )

    def get_data_scope(self, user: User) -> DataScope:
        role = user.role.name.value
        if role == "admin":
            return DataScope.ALL
        if role == "vendor":
            return DataScope.VENDOR_OWNED
        return DataScope.CUSTOMER_OWNED

    async def check_permission(self, user: User, permission_code: str) -> PermissionCheckResponse:
        allowed = await self.user_has_permission(user, permission_code)
        return PermissionCheckResponse(
            permission=permission_code,
            allowed=allowed,
        )
