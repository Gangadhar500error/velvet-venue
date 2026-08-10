import uuid

import pytest
from httpx import AsyncClient

AUTH_BASE = "/api/v1/auth"
OWNERS_BASE = "/api/v1/venue-owners"
BP_BASE = "/api/v1/business-profiles"


async def _login(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _first_owner_id(client: AsyncClient, token: str) -> str:
    response = await client.get(OWNERS_BASE, headers=_auth(token))
    assert response.status_code == 200
    items = response.json()["items"]
    assert items, "Expected seeded venue owners"
    return items[0]["id"]


@pytest.mark.asyncio
async def test_admin_lists_business_profiles(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    response = await client.get(BP_BASE, headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_business_profile(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    owner_id = await _first_owner_id(client, token)
    suffix = uuid.uuid4().hex[:6].upper()

    create = await client.post(
        BP_BASE,
        headers=_auth(token),
        json={
            "venue_owner_id": owner_id,
            "business_name": f"Test Halls {suffix}",
            "legal_business_name": f"Test Halls {suffix} Pvt Ltd",
            "business_type": "Private Limited",
            "city": "Hyderabad",
            "country": "India",
            "gst_number": f"36AABC{suffix[:4]}1Z5",
            "pan_number": f"AABC{suffix[:5]}",
            "website": "https://testhalls.example.com",
            "support_email": f"ops_{suffix.lower()}@example.com",
            "support_phone": "+919811122233",
            "ifsc_code": "HDFC0001234",
            "status": "pending",
            "verification_status": "pending",
        },
    )
    assert create.status_code == 201, create.text
    data = create.json()
    assert data["success"] is True
    profile = data["business_profile"]
    assert profile["business_name"].startswith("Test Halls")
    assert profile["venue_owner_id"] == owner_id
    assert profile["owner_name"]
    assert len(profile["documents"]) >= 1

    detail = await client.get(f"{BP_BASE}/{profile['id']}", headers=_auth(token))
    assert detail.status_code == 200
    assert detail.json()["business_code"] == profile["business_code"]


@pytest.mark.asyncio
async def test_duplicate_gst_rejected(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    owner_id = await _first_owner_id(client, token)
    suffix = uuid.uuid4().hex[:6].upper()
    gst = f"36DUPL{suffix[:4]}1Z9"

    first = await client.post(
        BP_BASE,
        headers=_auth(token),
        json={
            "venue_owner_id": owner_id,
            "business_name": f"Dup One {suffix}",
            "legal_business_name": f"Dup One {suffix}",
            "business_type": "LLP",
            "gst_number": gst,
            "city": "Hyderabad",
        },
    )
    assert first.status_code == 201, first.text

    second = await client.post(
        BP_BASE,
        headers=_auth(token),
        json={
            "venue_owner_id": owner_id,
            "business_name": f"Dup Two {suffix}",
            "legal_business_name": f"Dup Two {suffix}",
            "business_type": "LLP",
            "gst_number": gst,
            "city": "Hyderabad",
        },
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_soft_delete_business_profile(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    owner_id = await _first_owner_id(client, token)
    suffix = uuid.uuid4().hex[:6].upper()

    create = await client.post(
        BP_BASE,
        headers=_auth(token),
        json={
            "venue_owner_id": owner_id,
            "business_name": f"Delete Me {suffix}",
            "legal_business_name": f"Delete Me {suffix}",
            "business_type": "Partnership",
            "city": "Warangal",
            "pan_number": f"DELM{suffix[:5]}",
        },
    )
    assert create.status_code == 201, create.text
    profile_id = create.json()["business_profile"]["id"]

    deleted = await client.delete(f"{BP_BASE}/{profile_id}", headers=_auth(token))
    assert deleted.status_code == 200

    missing = await client.get(f"{BP_BASE}/{profile_id}", headers=_auth(token))
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_customer_cannot_access_business_profiles(client: AsyncClient):
    token = await _login(client, "customer@velvetvenues.com", "Customer@123")
    response = await client.get(BP_BASE, headers=_auth(token))
    assert response.status_code == 403
