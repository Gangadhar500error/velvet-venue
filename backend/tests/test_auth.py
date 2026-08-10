import uuid

import pytest
from httpx import AsyncClient

from app.main import app

BASE_URL = "http://test"
AUTH_BASE = "/api/v1/auth"


def unique_email(prefix: str = "user") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


@pytest.mark.asyncio
async def test_signup_customer_success(client: AsyncClient):
    email = unique_email("customer")
    response = await client.post(
        f"{AUTH_BASE}/signup",
        json={
            "role": "customer",
            "first_name": "Test",
            "last_name": "Customer",
            "email": email,
            "phone": "+1234567890",
            "password": "SecurePass123",
            "confirm_password": "SecurePass123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Registration successful."


@pytest.mark.asyncio
async def test_signup_vendor_success(client: AsyncClient):
    email = unique_email("vendor")
    response = await client.post(
        f"{AUTH_BASE}/signup",
        json={
            "role": "vendor",
            "first_name": "Test",
            "last_name": "Vendor",
            "email": email,
            "password": "SecurePass123",
            "confirm_password": "SecurePass123",
        },
    )
    assert response.status_code == 201
    assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient):
    email = unique_email("duplicate")
    payload = {
        "role": "customer",
        "first_name": "Test",
        "last_name": "User",
        "email": email,
        "password": "SecurePass123",
        "confirm_password": "SecurePass123",
    }
    first = await client.post(f"{AUTH_BASE}/signup", json=payload)
    assert first.status_code == 201

    second = await client.post(f"{AUTH_BASE}/signup", json=payload)
    assert second.status_code == 409
    assert second.json()["success"] is False
    assert "already registered" in second.json()["message"].lower()


@pytest.mark.asyncio
async def test_signup_password_mismatch(client: AsyncClient):
    response = await client.post(
        f"{AUTH_BASE}/signup",
        json={
            "role": "customer",
            "first_name": "Test",
            "last_name": "User",
            "email": unique_email(),
            "password": "SecurePass123",
            "confirm_password": "DifferentPass123",
        },
    )
    assert response.status_code == 422
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(
        f"{AUTH_BASE}/login",
        json={
            "email": "customer@velvetvenues.com",
            "password": "Customer@123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["token_type"] == "Bearer"
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["role"] == "customer"
    assert data["user"]["name"]


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    response = await client.post(
        f"{AUTH_BASE}/login",
        json={
            "email": "customer@velvetvenues.com",
            "password": "WrongPassword123",
        },
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert "invalid email or password" in data["message"].lower()


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient):
    login = await client.post(
        f"{AUTH_BASE}/login",
        json={
            "email": "customer@velvetvenues.com",
            "password": "Customer@123",
        },
    )
    token = login.json()["access_token"]

    response = await client.get(
        f"{AUTH_BASE}/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["email"] == "customer@velvetvenues.com"
    assert data["role"] == "customer"
    assert "created_at" in data


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    response = await client.get(f"{AUTH_BASE}/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    login = await client.post(
        f"{AUTH_BASE}/login",
        json={
            "email": "customer@velvetvenues.com",
            "password": "Customer@123",
        },
    )
    refresh_token = login.json()["refresh_token"]

    response = await client.post(
        f"{AUTH_BASE}/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["access_token"]
    assert data["token_type"] == "Bearer"


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient):
    email = unique_email("changepw")
    password = "SecurePass123"
    new_password = "NewSecure456"

    await client.post(
        f"{AUTH_BASE}/signup",
        json={
            "role": "customer",
            "first_name": "Change",
            "last_name": "Password",
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )

    login = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": email, "password": password},
    )
    token = login.json()["access_token"]

    response = await client.post(
        f"{AUTH_BASE}/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "old_password": password,
            "new_password": new_password,
            "confirm_password": new_password,
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    old_login = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": email, "password": password},
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": email, "password": new_password},
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient):
    response = await client.post(
        f"{AUTH_BASE}/forgot-password",
        json={"email": "customer@velvetvenues.com"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    login = await client.post(
        f"{AUTH_BASE}/login",
        json={
            "email": "customer@velvetvenues.com",
            "password": "Customer@123",
        },
    )
    refresh_token = login.json()["refresh_token"]

    response = await client.post(
        f"{AUTH_BASE}/logout",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_jwt_contains_role(client: AsyncClient):
    admin_login = await client.post(
        f"{AUTH_BASE}/login",
        json={
            "email": "admin@velvetvenues.com",
            "password": "Admin@123",
        },
    )
    assert admin_login.status_code == 200
    assert admin_login.json()["user"]["role"] == "admin"

    customer_login = await client.post(
        f"{AUTH_BASE}/login",
        json={
            "email": "customer@velvetvenues.com",
            "password": "Customer@123",
        },
    )
    assert customer_login.status_code == 200
    assert customer_login.json()["user"]["role"] == "customer"


@pytest.mark.asyncio
async def test_reset_and_verify_email_stubs(client: AsyncClient):
    reset = await client.post(
        f"{AUTH_BASE}/reset-password",
        json={
            "token": "dummy-token",
            "new_password": "SecurePass123",
            "confirm_password": "SecurePass123",
        },
    )
    assert reset.status_code == 200
    assert reset.json()["success"] is True

    verify = await client.post(
        f"{AUTH_BASE}/verify-email",
        json={"token": "dummy-token"},
    )
    assert verify.status_code == 200
    assert verify.json()["success"] is True
