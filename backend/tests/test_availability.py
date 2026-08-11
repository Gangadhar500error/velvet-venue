import uuid
from datetime import date, timedelta

import pytest
from httpx import AsyncClient

from app.db.session import AsyncSessionLocal
from app.schemas.availability import BookingHoldRequest
from app.services.availability_service import AvailabilityService

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


async def _create_venue(client: AsyncClient, token: str, **extra) -> str:
    bp_id = await _first_business_id(client, token)
    suffix = uuid.uuid4().hex[:6]
    payload = {
        "business_profile_id": bp_id,
        "venue_name": f"Availability Hall {suffix}",
        "category": "Banquet Hall",
        "city": "Hyderabad",
        "venue_status": "draft",
        **extra,
    }
    response = await client.post(VENUES_BASE, headers=_auth(token), json=payload)
    assert response.status_code == 201, response.text
    return response.json()["venue"]["id"]


async def _set_pricing(client: AsyncClient, token: str, venue_id: str, mode: str = "full_day") -> None:
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
    created = await client.post(
        f"{VENUES_BASE}/{venue_id}/pricing",
        headers=_auth(token),
        json={
            "pricing_mode": mode,
            "pricing_type": "venue_only",
            "gst_percent": 18,
            "advance_percent": 25,
            "booking_window_days": 90,
            "operating_hours": "09:00 AM - 11:00 PM",
            "slots": slots,
        },
    )
    assert created.status_code == 201, created.text


def _future_date(days: int = 14) -> date:
    return date.today() + timedelta(days=days)


@pytest.mark.asyncio
async def test_month_availability_generated_from_pricing(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    await _set_pricing(client, token, venue_id, "full_day")

    month = date.today().strftime("%Y-%m")
    response = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability",
        headers=_auth(token),
        params={"month": month},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["pricing_mode"] == "full_day"
    assert len(body["days"]) >= 1
    today = date.today().isoformat()
    today_row = next((d for d in body["days"] if d["date"] == today), None)
    assert today_row is not None
    assert today_row["status"] in {"available", "holiday", "blocked"}
    assert today_row["slots"]
    assert today_row["slots"][0]["slot_key"] == "full_day"


@pytest.mark.asyncio
async def test_slot_based_month_and_day_detail(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    await _set_pricing(client, token, venue_id, "slot_based")
    target = _future_date(10).isoformat()

    detail = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/{target}",
        headers=_auth(token),
    )
    assert detail.status_code == 200, detail.text
    day = detail.json()["day"]
    keys = {s["slot_key"] for s in day["slots"] if s["slot_kind"] == "venue"}
    assert "morning" in keys
    assert "afternoon" in keys


@pytest.mark.asyncio
async def test_list_and_dashboard(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    await _set_pricing(client, token, venue_id)
    month = date.today().strftime("%Y-%m")

    listed = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/list",
        headers=_auth(token),
        params={"month": month, "page": 1, "page_size": 31},
    )
    assert listed.status_code == 200, listed.text
    assert listed.json()["total"] >= 1

    dash = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/dashboard",
        headers=_auth(token),
        params={"month": month},
    )
    assert dash.status_code == 200, dash.text
    cards = dash.json()
    assert "available_days" in cards
    assert "occupancy_percent" in cards
    assert cards["available_days"] + cards["booked_days"] + cards["blocked_days"] >= 0


@pytest.mark.asyncio
async def test_manual_block_and_unblock(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    await _set_pricing(client, token, venue_id)
    target = _future_date(21)

    blocked = await client.post(
        f"{VENUES_BASE}/{venue_id}/availability/block",
        headers=_auth(token),
        json={
            "start_date": target.isoformat(),
            "end_date": target.isoformat(),
            "reason": "maintenance",
            "notes": "AC service",
        },
    )
    assert blocked.status_code == 200, blocked.text
    block_id = blocked.json()["block"]["id"]

    day = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/{target.isoformat()}",
        headers=_auth(token),
    )
    assert day.status_code == 200, day.text
    assert day.json()["day"]["status"] in {"blocked", "holiday"}

    removed = await client.delete(
        f"/api/v1/availability/block/{block_id}",
        headers=_auth(token),
    )
    assert removed.status_code == 200, removed.text

    restored = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/{target.isoformat()}",
        headers=_auth(token),
    )
    assert restored.status_code == 200
    assert restored.json()["day"]["status"] == "available"


@pytest.mark.asyncio
async def test_booking_reserve_cancel_and_complete(client: AsyncClient):
    token = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, token)
    await _set_pricing(client, token, venue_id, "slot_based")
    event_date = _future_date(12)
    booking_id = uuid.uuid4()

    async with AsyncSessionLocal() as db:
        service = AvailabilityService(db)
        await service.reserve(
            None,
            uuid.UUID(venue_id),
            BookingHoldRequest(
                event_date=event_date,
                slot_key="morning",
                booking_id=booking_id,
                booking_ref="BK-TEST-1",
                customer_name="Asha Rao",
                event_type="Wedding",
                guests=120,
            ),
        )

    day = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/{event_date.isoformat()}",
        headers=_auth(token),
    )
    assert day.status_code == 200, day.text
    payload = day.json()
    assert payload["day"]["status"] in {"booked", "partially_booked"}
    morning = next(s for s in payload["day"]["slots"] if s["slot_key"] == "morning")
    afternoon = next(s for s in payload["day"]["slots"] if s["slot_key"] == "afternoon")
    assert morning["status"] == "booked"
    assert morning["customer_name"] == "Asha Rao"
    assert afternoon["status"] == "available"

    async with AsyncSessionLocal() as db:
        service = AvailabilityService(db)
        await service.release(booking_id)

    restored = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/{event_date.isoformat()}",
        headers=_auth(token),
    )
    morning = next(s for s in restored.json()["day"]["slots"] if s["slot_key"] == "morning")
    assert morning["status"] == "available"

    booking_two = uuid.uuid4()
    async with AsyncSessionLocal() as db:
        service = AvailabilityService(db)
        await service.reserve(
            None,
            uuid.UUID(venue_id),
            BookingHoldRequest(
                event_date=event_date,
                slot_key="afternoon",
                booking_id=booking_two,
                customer_name="Guest",
            ),
        )
        await service.complete(booking_two)

    completed = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability/{event_date.isoformat()}",
        headers=_auth(token),
    )
    afternoon = next(s for s in completed.json()["day"]["slots"] if s["slot_key"] == "afternoon")
    assert afternoon["status"] == "completed"


@pytest.mark.asyncio
async def test_customer_read_only_and_vendor_scope(client: AsyncClient):
    admin = await _login(client, "admin@velvetvenues.com", "Admin@123")
    venue_id = await _create_venue(client, admin)
    await _set_pricing(client, admin, venue_id)
    approved = await client.post(f"{VENUES_BASE}/{venue_id}/approve", headers=_auth(admin))
    assert approved.status_code == 200, approved.text

    customer = await _login(client, "customer@velvetvenues.com", "Customer@123")
    readable = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability",
        headers=_auth(customer),
    )
    assert readable.status_code == 200, readable.text
    for day in readable.json()["days"]:
        for slot in day["slots"]:
            assert slot["customer_name"] is None

    blocked = await client.post(
        f"{VENUES_BASE}/{venue_id}/availability/block",
        headers=_auth(customer),
        json={"start_date": _future_date().isoformat(), "reason": "maintenance"},
    )
    assert blocked.status_code == 403

    vendor = await _login(client, "vendor@velvetvenues.com", "Vendor@123")
    vendor_forbidden = await client.get(
        f"{VENUES_BASE}/{venue_id}/availability",
        headers=_auth(vendor),
    )
    assert vendor_forbidden.status_code == 403
