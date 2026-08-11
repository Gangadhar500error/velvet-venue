import uuid
from datetime import date, timedelta

import pytest
from httpx import AsyncClient

AUTH_BASE = "/api/v1/auth"
BP_BASE = "/api/v1/business-profiles"
CUSTOMERS_BASE = "/api/v1/customers"
VENUES_BASE = "/api/v1/venues"
BOOKINGS_BASE = "/api/v1/bookings"


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
    assert items
    return items[0]["id"]


async def _create_customer(client: AsyncClient, token: str) -> str:
    email = f"book_{uuid.uuid4().hex[:8]}@example.com"
    mobile = f"+9198{uuid.uuid4().int % 10_000_000:07d}"
    response = await client.post(
        CUSTOMERS_BASE,
        headers=_auth(token),
        json={
            "name": "Booking Customer",
            "email": email,
            "mobile": mobile,
            "city": "Hyderabad",
        },
    )
    assert response.status_code in (200, 201), response.text
    return response.json()["customer"]["id"]


async def _create_venue(
    client: AsyncClient,
    token: str,
    *,
    mode: str = "full_day",
    business_profile_id: str | None = None,
) -> str:
    bp_id = business_profile_id or await _first_business_id(client, token)
    suffix = uuid.uuid4().hex[:6]
    slots = (
        [
            {
                "key": "morning",
                "name": "Morning",
                "time_label": "09:00 AM - 01:00 PM",
                "price": 18000,
                "enabled": True,
            },
            {
                "key": "afternoon",
                "name": "Afternoon",
                "time_label": "02:00 PM - 06:00 PM",
                "price": 22000,
                "enabled": True,
            },
        ]
        if mode == "slot_based"
        else [
            {
                "key": "full_day",
                "name": "Full Day",
                "time_label": "09:00 AM - 11:00 PM",
                "price": 50000,
                "enabled": True,
            }
        ]
    )
    foods = []
    pricing_type = "venue_only"
    if mode == "venue_food":
        pricing_type = "venue_food"
        foods = [
            {
                "key": "lunch",
                "name": "Lunch",
                "time_label": "12:00 PM - 03:00 PM",
                "veg_plate_cost": 650,
                "non_veg_plate_cost": 850,
                "enabled": True,
            }
        ]
        mode = "full_day"
    response = await client.post(
        VENUES_BASE,
        headers=_auth(token),
        json={
            "business_profile_id": bp_id,
            "venue_name": f"Booking Hall {suffix}",
            "category": "Banquet Hall",
            "city": "Hyderabad",
            "maximum_guests": 300,
            "venue_status": "published",
            "approval_status": "approved",
            "pricing": {
                "pricing_mode": mode,
                "pricing_type": pricing_type,
                "gst_percent": 18,
                "advance_percent": 25,
                "booking_window_days": 180,
                "minimum_notice_hours": 24,
                "slots": slots,
                "food_slots": foods,
            },
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["venue"]["id"]


@pytest.mark.asyncio
async def test_create_booking_updates_availability(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    customer_id = await _create_customer(client, token)
    event_date = (date.today() + timedelta(days=10)).isoformat()

    created = await client.post(
        BOOKINGS_BASE,
        headers=_auth(token),
        json={
            "venue_id": venue_id,
            "customer_id": customer_id,
            "event_date": event_date,
            "event_type": "Wedding",
            "guest_count": 150,
            "slot_keys": ["full_day"],
        },
    )
    assert created.status_code == 201, created.text
    booking = created.json()["booking"]
    assert booking["booking_number"].startswith("BK-")
    assert booking["payment_summary"]["total_amount"] > 0
    assert booking["invoices"]
    assert booking["slots"]
    assert booking["venue"]["venue_name"]
    assert booking["customer"]["name"]

    detail = await client.get(f"{BOOKINGS_BASE}/{booking['id']}", headers=_auth(token))
    assert detail.status_code == 200
    assert detail.json()["timeline"]

    day = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/{event_date}", headers=_auth(token)
    )
    assert day.status_code == 200
    payload = day.json()["day"]
    assert payload["status"] in {"booked", "partially_booked"}
    assert booking["id"] in [str(item) for item in payload["booking_ids"]]
    assert payload["booking_count"] >= 1
    assert payload["bookings"]
    assert payload["bookings"][0]["booking_id"] == booking["id"]
    assert payload["booked_slot_names"]

    listed = await client.get(BOOKINGS_BASE, headers=_auth(token))
    assert listed.status_code == 200
    assert any(item["id"] == booking["id"] for item in listed.json()["items"])


@pytest.mark.asyncio
async def test_slot_booking_leaves_other_slots_open(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token, mode="slot_based")
    customer_id = await _create_customer(client, token)
    event_date = (date.today() + timedelta(days=12)).isoformat()

    created = await client.post(
        BOOKINGS_BASE,
        headers=_auth(token),
        json={
            "venue_id": venue_id,
            "customer_id": customer_id,
            "event_date": event_date,
            "booking_mode": "slot_based",
            "slot_keys": ["morning"],
            "guest_count": 80,
        },
    )
    assert created.status_code == 201, created.text

    check = await client.get(
        f"{BOOKINGS_BASE}/availability",
        headers=_auth(token),
        params={"venue_id": venue_id, "date": event_date},
    )
    assert check.status_code == 200
    body = check.json()
    assert body["day_status"] == "partially_booked"
    keys = {s["slot_key"] for s in body["remaining_slots"]}
    assert "afternoon" in keys
    assert "morning" not in keys

    duplicate = await client.post(
        BOOKINGS_BASE,
        headers=_auth(token),
        json={
            "venue_id": venue_id,
            "customer_id": customer_id,
            "event_date": event_date,
            "booking_mode": "slot_based",
            "slot_keys": ["morning"],
            "guest_count": 40,
        },
    )
    assert duplicate.status_code in (409, 422)


@pytest.mark.asyncio
async def test_venue_food_booking_and_payment(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token, mode="venue_food")
    customer_id = await _create_customer(client, token)
    event_date = (date.today() + timedelta(days=14)).isoformat()

    created = await client.post(
        BOOKINGS_BASE,
        headers=_auth(token),
        json={
            "venue_id": venue_id,
            "customer_id": customer_id,
            "event_date": event_date,
            "booking_type": "venue_food",
            "guest_count": 100,
            "food_slots": [{"meal_key": "lunch", "veg_count": 60, "nonveg_count": 40}],
            "services": [{"name": "Decoration", "price": 5000, "quantity": 1}],
        },
    )
    assert created.status_code == 201, created.text
    booking = created.json()["booking"]
    assert booking["food_slots"]
    assert booking["services"]
    assert booking["payment_summary"]["total_amount"] > booking["payment_summary"]["subtotal"] - 1

    paid = await client.post(
        f"{BOOKINGS_BASE}/{booking['id']}/payments",
        headers=_auth(token),
        json={"amount": 1000, "payment_type": "advance", "gateway": "upi"},
    )
    assert paid.status_code == 200, paid.text
    assert paid.json()["booking"]["payment_status"] == "partial"
    assert paid.json()["booking"]["payments"]


@pytest.mark.asyncio
async def test_cancel_releases_availability(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    customer_id = await _create_customer(client, token)
    event_date = (date.today() + timedelta(days=16)).isoformat()
    created = await client.post(
        BOOKINGS_BASE,
        headers=_auth(token),
        json={
            "venue_id": venue_id,
            "customer_id": customer_id,
            "event_date": event_date,
            "guest_count": 50,
        },
    )
    assert created.status_code == 201, created.text
    booking_id = created.json()["booking"]["id"]
    cancelled = await client.delete(f"{BOOKINGS_BASE}/{booking_id}", headers=_auth(token))
    assert cancelled.status_code == 200
    check = await client.get(
        f"{BOOKINGS_BASE}/availability",
        headers=_auth(token),
        params={"venue_id": venue_id, "date": event_date},
    )
    assert check.status_code == 200
    assert check.json()["day_status"] == "available"


@pytest.mark.asyncio
async def test_vendor_and_customer_scopes(client: AsyncClient):
    admin = await _login(client, "admin@velvetvenues.com", "Admin@123")
    vendor = await _login(client, "vendor@velvetvenues.com", "Vendor@123")
    vendor_bp = await _first_business_id(client, vendor)
    venue_id = await _create_venue(client, admin, business_profile_id=vendor_bp)
    customer_id = await _create_customer(client, admin)
    event_date = (date.today() + timedelta(days=18)).isoformat()
    created = await client.post(
        BOOKINGS_BASE,
        headers=_auth(admin),
        json={
            "venue_id": venue_id,
            "customer_id": customer_id,
            "event_date": event_date,
            "guest_count": 40,
        },
    )
    assert created.status_code == 201, created.text
    booking = created.json()["booking"]
    booking_id = booking["id"]

    vendor_list = await client.get(
        f"{BOOKINGS_BASE}/vendor",
        headers=_auth(vendor),
        params={"search": booking["booking_number"]},
    )
    assert vendor_list.status_code == 200
    vendor_ids = {item["id"] for item in vendor_list.json()["items"]}
    assert booking_id in vendor_ids
    owned = await client.get(f"{BOOKINGS_BASE}/{booking_id}", headers=_auth(vendor))
    assert owned.status_code == 200

    customer = await _login(client, "customer@velvetvenues.com", "Customer@123")
    customer_list = await client.get(f"{BOOKINGS_BASE}/customer", headers=_auth(customer))
    assert customer_list.status_code == 200
    assert booking_id not in {item["id"] for item in customer_list.json()["items"]}
    forbidden = await client.get(f"{BOOKINGS_BASE}/{booking_id}", headers=_auth(customer))
    assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_guest_capacity_rejected(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    customer_id = await _create_customer(client, token)
    event_date = (date.today() + timedelta(days=20)).isoformat()
    created = await client.post(
        BOOKINGS_BASE,
        headers=_auth(token),
        json={
            "venue_id": venue_id,
            "customer_id": customer_id,
            "event_date": event_date,
            "guest_count": 9999,
        },
    )
    assert created.status_code == 422


@pytest.mark.asyncio
async def test_booking_quote_uses_backend_pricing(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    customer_id = await _create_customer(client, token)
    event_date = (date.today() + timedelta(days=22)).isoformat()

    quote = await client.post(
        f"{BOOKINGS_BASE}/quote",
        headers=_auth(token),
        json={
            "venue_id": venue_id,
            "customer_id": customer_id,
            "event_date": event_date,
            "slot_keys": ["full_day"],
            "guest_count": 80,
        },
    )
    assert quote.status_code == 200, quote.text
    body = quote.json()
    assert body["venue_price"] > 0
    assert body["gst_amount"] >= 0
    assert body["grand_total"] >= body["venue_price"]
    assert body["advance"] > 0
    assert body["remaining"] >= 0
    assert "commission" in body
    assert "vendor_amount" in body

    unauth = await client.post(
        f"{BOOKINGS_BASE}/quote",
        json={
            "venue_id": venue_id,
            "event_date": event_date,
            "slot_keys": ["full_day"],
        },
    )
    assert unauth.status_code in (401, 403)
