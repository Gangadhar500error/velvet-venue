from typing import Annotated

from fastapi import APIRouter, Body, Depends, status

from app.dependencies.auth import get_auth_service, get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    MeResponse,
    MessageResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer or vendor",
    responses={
        201: {
            "description": "Registration successful",
            "content": {
                "application/json": {
                    "example": {"success": True, "message": "Registration successful."}
                }
            },
        },
        409: {"description": "Email already registered"},
        403: {"description": "Admin registration not allowed"},
    },
)
async def signup(
    payload: SignupRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> SignupResponse:
    return await auth_service.signup(payload)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login with email and password",
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "Bearer",
                        "user": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "name": "John Doe",
                            "role": "customer",
                        },
                    }
                }
            },
        },
        401: {"description": "Invalid email or password"},
        403: {"description": "Account inactive"},
    },
)
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> LoginResponse:
    return await auth_service.login(payload)


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Get current authenticated user profile",
    responses={
        200: {
            "description": "Current user profile",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "email": "customer@velvetvenues.com",
                        "role": "customer",
                        "phone": "+1234567890",
                        "first_name": "Customer",
                        "last_name": "User",
                        "created_at": "2026-08-10T10:00:00Z",
                    }
                }
            },
        },
        401: {"description": "Not authenticated"},
    },
)
async def me(
    current_user: Annotated[User, Depends(get_current_active_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MeResponse:
    return await auth_service.get_me(current_user)


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    summary="Refresh access token using a refresh token",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> RefreshTokenResponse:
    return await auth_service.refresh_access_token(payload)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Logout current user",
)
async def logout(
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    payload: RefreshTokenRequest | None = Body(default=None),
) -> LogoutResponse:
    refresh_token = payload.refresh_token if payload else None
    return await auth_service.logout(refresh_token)


@router.post(
    "/change-password",
    response_model=ChangePasswordResponse,
    summary="Change password for authenticated user",
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ChangePasswordResponse:
    return await auth_service.change_password(current_user, payload)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset link",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    return await auth_service.forgot_password(payload)


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using a reset token",
)
async def reset_password(
    payload: ResetPasswordRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    return await auth_service.reset_password(payload)


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address using a verification token",
)
async def verify_email(
    payload: VerifyEmailRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    return await auth_service.verify_email(payload)
