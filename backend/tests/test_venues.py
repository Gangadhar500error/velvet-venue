import uuid

import pytest
from httpx import AsyncClient

AUTH_BASE = "/api/v1/auth"
BP_BASE = "/api/v1/business-profiles"
VENUES_BASE = "/api/v1/venues"


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


@pytest.mark.asyncio
async def test_admin_lists_venues(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    response = await client.get(VENUES_BASE, headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data


@pytest.mark.asyncio
async def test_create_venue_with_pricing(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    bp_id = await _first_business_id(client, token)
    suffix = uuid.uuid4().hex[:6]

    create = await client.post(
        VENUES_BASE,
        headers=_auth(token),
        json={
            "business_profile_id": bp_id,
            "venue_name": f"Test Banquet {suffix}",
            "category": "Banquet Hall",
            "venue_type": "Indoor",
            "city": "Hyderabad",
            "country": "India",
            "seating_capacity": 250,
            "maximum_guests": 300,
            "venue_status": "pending",
            "approval_status": "pending",
            "amenities": ["Parking", "WiFi", "AC"],
            "services": ["Decorations", "DJ"],
            "event_categories": ["Wedding", "Reception"],
            "pricing": {
                "pricing_mode": "full_day",
                "pricing_type": "venue_only",
                "gst_percent": 18,
                "advance_percent": 30,
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
        },
    )
    assert create.status_code == 201, create.text
    venue = create.json()["venue"]
    assert venue["venue_name"].startswith("Test Banquet")
    assert venue["pricing"]["pricing_type"] == "venue_only"
    assert len(venue["amenities"]) == 3
    assert isinstance(venue["amenities"][0], dict)
    assert venue["amenities"][0]["name"]
    assert venue["amenities"][0]["icon"]
    assert len(venue["pricing"]["slots"]) == 1
    assert venue["business_profile"]["business_name"]
    assert venue["owner"]["name"] is not None
    assert venue["location"]["city"] == "Hyderabad"
    assert venue["booking_summary"]["today_bookings"] == 0
    assert venue["seo"]["title"]
    assert venue["availability"]
    assert venue["availability"][0]["slots"]

    detail = await client.get(f"{VENUES_BASE}/{venue['id']}", headers=_auth(token))
    assert detail.status_code == 200
    body = detail.json()
    assert body["venue_code"] == venue["venue_code"]
    assert body["reviews"]["total_reviews"] == 0
    assert isinstance(body["reviews"]["items"], list)
    assert body["availability"]
    dates = [row["date"] for row in body["availability"]]
    assert len(dates) == len(set(dates))

    pricing = await client.get(
        f"{VENUES_BASE}/{venue['id']}/pricing", headers=_auth(token)
    )
    assert pricing.status_code == 200
    assert pricing.json()["advance_percent"] == 30

    preview = await client.post(
        f"{VENUES_BASE}/{venue['id']}/pricing/preview",
        headers=_auth(token),
        json={"guests": 100},
    )
    assert preview.status_code == 200
    body = preview.json()
    assert body["booking_total"] > 0
    assert body["advance_payable"] > 0


@pytest.mark.asyncio
async def test_soft_delete_venue(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    bp_id = await _first_business_id(client, token)
    suffix = uuid.uuid4().hex[:6]
    create = await client.post(
        VENUES_BASE,
        headers=_auth(token),
        json={
            "business_profile_id": bp_id,
            "venue_name": f"Delete Venue {suffix}",
            "category": "Lawn",
            "city": "Warangal",
        },
    )
    assert create.status_code == 201, create.text
    venue_id = create.json()["venue"]["id"]
    deleted = await client.delete(f"{VENUES_BASE}/{venue_id}", headers=_auth(token))
    assert deleted.status_code == 200
    missing = await client.get(f"{VENUES_BASE}/{venue_id}", headers=_auth(token))
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_customer_venue_access(client: AsyncClient):
    token = await _login(client, "customer@velvetvenues.com", "Customer@123")
    response = await client.get(VENUES_BASE, headers=_auth(token))
    # Customer may have Venue.View for published, or 403 if not granted
    assert response.status_code in (200, 403)
