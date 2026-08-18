"""Seed permissions, role-permission mappings, and navigation menus."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.core.menu_catalog import MENU_DEFINITIONS
from app.core.permissions_catalog import ALL_PERMISSIONS, ROLE_PERMISSION_MAP
from app.models.permission import Menu, Permission
from app.models.role import Role, RoleName
from app.repositories.role_repository import RoleRepository

logger = get_logger(__name__)

ROLE_NAME_MAP = {
    "admin": RoleName.ADMIN,
    "vendor": RoleName.VENDOR,
    "customer": RoleName.CUSTOMER,
}


async def seed_permissions(session) -> dict[str, Permission]:
    perm_by_code: dict[str, Permission] = {}

    for pdef in ALL_PERMISSIONS:
        result = await session.execute(
            select(Permission).where(Permission.code == pdef.code)
        )
        existing = result.scalar_one_or_none()
        if existing:
            perm_by_code[pdef.code] = existing
            continue

        permission = Permission(
            id=uuid.uuid4(),
            code=pdef.code,
            module=pdef.module,
            action=pdef.action,
            name=pdef.name,
            description=pdef.description or None,
        )
        session.add(permission)
        perm_by_code[pdef.code] = permission
        logger.info("Permission created: %s", pdef.code)

    await session.flush()
    return perm_by_code


async def seed_role_permissions(session, perm_by_code: dict[str, Permission]) -> None:
    role_repo = RoleRepository(session)

    for role_key, codes in ROLE_PERMISSION_MAP.items():
        role_name = ROLE_NAME_MAP[role_key]
        role = await role_repo.get_or_create(role_name)

        result = await session.execute(
            select(Role)
            .options(selectinload(Role.permissions))
            .where(Role.id == role.id)
        )
        role = result.scalar_one()

        target_codes = set(codes)
        role.permissions = [p for p in role.permissions if p.code in target_codes]
        assigned = {p.code for p in role.permissions}
        for code in codes:
            if code not in perm_by_code:
                logger.warning("Unknown permission code for %s: %s", role_key, code)
                continue
            if code in assigned:
                continue
            role.permissions.append(perm_by_code[code])
            logger.info("Assigned %s -> %s", role_key, code)

    await session.flush()


async def seed_menus(session) -> None:
    count = await session.scalar(select(func.count()).select_from(Menu))
    if count and count > 0:
        logger.info("Menus already seeded, skipped")
        return

    menus_by_key: dict[str, Menu] = {}
    for mdef in MENU_DEFINITIONS:
        parent_id = menus_by_key[mdef.parent_key].id if mdef.parent_key else None
        menu = Menu(
            id=uuid.uuid4(),
            label=mdef.label,
            href=mdef.href,
            icon=mdef.icon,
            permission_code=mdef.permission_code,
            parent_id=parent_id,
            portal=mdef.portal,
            sort_order=mdef.sort_order,
            is_active=True,
        )
        session.add(menu)
        menus_by_key[mdef.key] = menu
        logger.info("Menu created: %s (%s)", mdef.label, mdef.portal)

    await session.flush()


async def run_rbac_seed(session) -> None:
    perm_by_code = await seed_permissions(session)
    await seed_role_permissions(session, perm_by_code)
    await seed_menus(session)
