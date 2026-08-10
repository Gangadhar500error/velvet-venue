import pytest
from httpx import AsyncClient

AUTH_BASE = "/api/v1/auth"
RBAC_BASE = "/api/v1/rbac"

ADMIN_EMAIL = "admin@velvetvenues.com"
ADMIN_PASSWORD = "Admin@123"
VENDOR_EMAIL = "vendor@velvetvenues.com"
VENDOR_PASSWORD = "Vendor@123"
CUSTOMER_EMAIL = "customer@velvetvenues.com"
CUSTOMER_PASSWORD = "Customer@123"


async def _login(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_has_full_permissions(client: AsyncClient):
    token = await _login(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    response = await client.get(
        f"{AUTH_BASE}/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "admin"
    assert data["portal"] == "admin"
    assert "Venue.View" in data["permissions"]
    assert "Venue.Create" in data["permissions"]
    assert data["data_scope"] == "all"


@pytest.mark.asyncio
async def test_vendor_permissions_subset(client: AsyncClient):
    token = await _login(client, VENDOR_EMAIL, VENDOR_PASSWORD)
    response = await client.get(
        f"{AUTH_BASE}/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "vendor"
    assert data["portal"] == "vendor"
    assert "Venue.View" in data["permissions"]
    assert "Venue.Create" in data["permissions"]
    assert "User.View" not in data["permissions"]
    assert data["data_scope"] == "vendor_owned"


@pytest.mark.asyncio
async def test_customer_permissions(client: AsyncClient):
    token = await _login(client, CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
    response = await client.get(
        f"{AUTH_BASE}/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "customer"
    assert data["portal"] == "customer"
    assert "Booking.View" in data["permissions"]
    assert "Venue.Create" not in data["permissions"]
    assert data["data_scope"] == "customer_owned"


@pytest.mark.asyncio
async def test_menus_filtered_by_role(client: AsyncClient):
    admin_token = await _login(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    vendor_token = await _login(client, VENDOR_EMAIL, VENDOR_PASSWORD)

    admin_menus = await client.get(
        f"{AUTH_BASE}/menus",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    vendor_menus = await client.get(
        f"{AUTH_BASE}/menus",
        headers={"Authorization": f"Bearer {vendor_token}"},
    )

    assert admin_menus.status_code == 200
    assert vendor_menus.status_code == 200

    admin_labels = {item["label"] for item in admin_menus.json()["items"]}
    vendor_labels = {item["label"] for item in vendor_menus.json()["items"]}

    assert "Reports" in admin_labels
    assert "Reports" not in vendor_labels
    assert "Business Profile" in vendor_labels or any(
        c["label"] == "Business Profile"
        for item in vendor_menus.json()["items"]
        for c in item.get("children", [])
    )


@pytest.mark.asyncio
async def test_rbac_endpoint_forbidden_for_customer(client: AsyncClient):
    token = await _login(client, CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
    response = await client.get(
        f"{RBAC_BASE}/customers",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_rbac_endpoint_allowed_for_admin(client: AsyncClient):
    token = await _login(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    response = await client.get(
        f"{RBAC_BASE}/venues",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_dashboard_widgets_by_portal(client: AsyncClient):
    vendor_token = await _login(client, VENDOR_EMAIL, VENDOR_PASSWORD)
    response = await client.get(
        f"{AUTH_BASE}/dashboard",
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["portal"] == "vendor"
    assert "my_venues" in data["widgets"]
    assert "total_users" not in data["widgets"]
