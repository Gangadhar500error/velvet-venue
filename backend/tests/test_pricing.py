import uuid

import pytest
from httpx import AsyncClient

AUTH_BASE = "/api/v1/auth"
BP_BASE = "/api/v1/business-profiles"
VENUES_BASE = "/api/v1/venues"
PRICING_BASE = "/api/v1/pricing"


async def _login(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _first_business_id(client: AsyncClient, token: str) -> str:
    response = await client.get(BP_BASE, headers=_auth(token))
    assert response.status_code == 200
    items = response.json()["items"]
    assert items, "Expected seeded business profiles"
    return items[0]["id"]


async def _create_venue(client: AsyncClient, token: str) -> str:
    bp_id = await _first_business_id(client, token)
    suffix = uuid.uuid4().hex[:6]
    response = await client.post(
        VENUES_BASE,
        headers=_auth(token),
        json={
            "business_profile_id": bp_id,
            "venue_name": f"Pricing Hall {suffix}",
            "category": "Banquet Hall",
            "city": "Hyderabad",
            "venue_status": "draft",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["venue"]["id"]


@pytest.mark.asyncio
async def test_full_day_pricing_preview(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)

    created = await client.post(
        f"{VENUES_BASE}/{venue_id}/pricing",
        headers=_auth(token),
        json={
            "pricing_mode": "full_day",
            "pricing_type": "venue_only",
            "gst_percent": 18,
            "advance_percent": 25,
            "operating_hours": "09:00 AM - 11:00 PM",
            "slots": [
                {
                    "key": "full_day",
                    "name": "Full Day",
                    "time_label": "09:00 AM - 11:00 PM",
                    "price": 50000,
                    "enabled": True,
                }
            ],
        },
    )
    assert created.status_code == 201, created.text
    pricing = created.json()["pricing"]
    assert pricing["pricing_mode"] == "full_day"
    assert len(pricing["slots"]) == 1
    assert pricing["operating_start_time"] is not None

    preview = await client.get(
        f"{PRICING_BASE}/{pricing['id']}/preview",
        headers=_auth(token),
    )
    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["venue_price"] == 50000
    assert body["gst_extra"] == 9000
    assert body["booking_total"] == 59000
    assert body["advance_payable"] == 14750
    assert body["platform_commission"] == 295
    assert body["vendor_receivable"] == 14455
    assert body["remaining_balance"] == 44250


@pytest.mark.asyncio
async def test_slot_based_crud_and_overlap(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    created = await client.post(
        f"{VENUES_BASE}/{venue_id}/pricing",
        headers=_auth(token),
        json={
            "pricing_mode": "slot_based",
            "pricing_type": "venue_only",
            "gst_percent": 18,
            "advance_percent": 30,
            "slots": [
                {
                    "key": "morning",
                    "name": "Morning",
                    "time_label": "09:00 AM - 01:00 PM",
                    "price": 18000,
                    "enabled": True,
                }
            ],
        },
    )
    assert created.status_code == 201, created.text
    pricing_id = created.json()["pricing"]["id"]

    second = await client.post(
        f"{PRICING_BASE}/{pricing_id}/slots",
        headers=_auth(token),
        json={
            "key": "evening",
            "name": "Evening",
            "time_label": "06:00 PM - 11:00 PM",
            "price": 28000,
            "enabled": True,
        },
    )
    assert second.status_code == 201, second.text

    overlap = await client.post(
        f"{PRICING_BASE}/{pricing_id}/slots",
        headers=_auth(token),
        json={
            "key": "clash",
            "name": "Clash",
            "time_label": "10:00 AM - 12:00 PM",
            "price": 15000,
            "enabled": True,
        },
    )
    assert overlap.status_code == 422

    duplicate = await client.post(
        f"{PRICING_BASE}/{pricing_id}/slots",
        headers=_auth(token),
        json={
            "key": "morning2",
            "name": "Morning",
            "time_label": "02:00 PM - 04:00 PM",
            "price": 12000,
            "enabled": True,
        },
    )
    assert duplicate.status_code == 422

    preview = await client.get(
        f"{PRICING_BASE}/{pricing_id}/preview",
        headers=_auth(token),
        params={"slot_key": "evening"},
    )
    assert preview.status_code == 200
    assert preview.json()["venue_price"] == 28000

    slot_id = second.json()["slot"]["id"]
    deleted = await client.delete(f"{PRICING_BASE}/slots/{slot_id}", headers=_auth(token))
    assert deleted.status_code == 200
    detail = await client.get(f"{PRICING_BASE}/{pricing_id}", headers=_auth(token))
    names = [s["name"] for s in detail.json()["slots"]]
    assert "Evening" not in names
    assert "Morning" in names


@pytest.mark.asyncio
async def test_food_pricing_preview_and_customer_denied(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    created = await client.post(
        f"{VENUES_BASE}/{venue_id}/pricing",
        headers=_auth(token),
        json={
            "pricing_mode": "full_day",
            "pricing_type": "venue_food",
            "gst_percent": 18,
            "advance_percent": 25,
            "food_slots": [
                {
                    "key": "lunch",
                    "name": "Lunch",
                    "time_label": "12:00 PM - 03:00 PM",
                    "veg_plate_cost": 650,
                    "non_veg_plate_cost": 750,
                    "min_guests": 50,
                    "max_guests": 400,
                    "enabled": True,
                }
            ],
        },
    )
    assert created.status_code == 201, created.text
    pricing_id = created.json()["pricing"]["id"]

    preview = await client.get(
        f"{PRICING_BASE}/{pricing_id}/preview",
        headers=_auth(token),
        params={"food_meal_key": "lunch", "guests": 100, "plate_type": "veg"},
    )
    assert preview.status_code == 200
    body = preview.json()
    assert body["food_total"] == 65000
    assert body["gst_extra"] == 11700
    assert body["booking_total"] == 76700

    customer = await _login(client, "customer@velvetvenues.com", "Customer@123")
    denied = await client.get(
        f"{PRICING_BASE}/{pricing_id}/preview",
        headers=_auth(customer),
    )
    assert denied.status_code == 403
