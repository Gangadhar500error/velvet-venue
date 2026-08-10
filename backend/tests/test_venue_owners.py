import uuid

import pytest
from httpx import AsyncClient

AUTH_BASE = "/api/v1/auth"
OWNERS_BASE = "/api/v1/venue-owners"


async def _login(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_admin_lists_venue_owners(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    response = await client.get(OWNERS_BASE, headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_venue_owner_links_user(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    email = f"owner_{uuid.uuid4().hex[:8]}@example.com"
    mobile = f"+9193{uuid.uuid4().int % 10_000_000:07d}"

    create = await client.post(
        OWNERS_BASE,
        headers=_auth(token),
        json={
            "first_name": "New",
            "last_name": "Owner",
            "email": email,
            "mobile": mobile,
            "business_name": "New Halls",
            "business_type": "Banquet",
            "city": "Hyderabad",
            "registration_source": "admin",
            "return_existing": False,
        },
    )
    assert create.status_code == 201
    data = create.json()
    assert data["existed"] is False
    assert data["venue_owner"]["user_id"] is not None
    owner_id = data["venue_owner"]["id"]

    again = await client.post(
        OWNERS_BASE,
        headers=_auth(token),
        json={
            "first_name": "New",
            "last_name": "Owner",
            "email": email,
            "mobile": mobile,
            "registration_source": "admin",
            "return_existing": True,
        },
    )
    assert again.status_code == 201
    assert again.json()["existed"] is True
    assert again.json()["venue_owner"]["id"] == owner_id


@pytest.mark.asyncio
async def test_venue_owner_detail_and_soft_delete(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    email = f"del_own_{uuid.uuid4().hex[:8]}@example.com"
    mobile = f"+9192{uuid.uuid4().int % 10_000_000:07d}"

    create = await client.post(
        OWNERS_BASE,
        headers=_auth(token),
        json={
            "name": "Delete Owner",
            "email": email,
            "mobile": mobile,
            "registration_source": "admin",
        },
    )
    owner_id = create.json()["venue_owner"]["id"]

    detail = await client.get(f"{OWNERS_BASE}/{owner_id}", headers=_auth(token))
    assert detail.status_code == 200
    assert detail.json()["overview"]["venues_count"] == 0

    deleted = await client.delete(f"{OWNERS_BASE}/{owner_id}", headers=_auth(token))
    assert deleted.status_code == 200

    missing = await client.get(f"{OWNERS_BASE}/{owner_id}", headers=_auth(token))
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_customer_cannot_list_venue_owners(client: AsyncClient):
    token = await _login(client, "customer@velvetvenues.com", "Customer@123")
    response = await client.get(OWNERS_BASE, headers=_auth(token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_vendor_login_includes_owner_profile(client: AsyncClient):
    login = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": "vendor@velvetvenues.com", "password": "Vendor@123"},
    )
    assert login.status_code == 200
    user = login.json()["user"]
    assert user["role"] == "vendor"
    assert user.get("venue_owner_id") or user.get("owner_code")
