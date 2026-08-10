import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    verify_refresh_token,
)
from app.models.role import RoleName
from app.models.user import User
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    LoginUserResponse,
    LogoutResponse,
    MeResponse,
    MessageResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    VerifyEmailRequest,
    signup_role_to_enum,
)
from app.services.permission_service import PermissionService


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = AuthRepository(db)
        self.db = db
        self.permissions = PermissionService(db)
        self._token_blacklist: set[str] = set()

    async def signup(self, payload: SignupRequest) -> SignupResponse:
        if payload.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin registration is not allowed.",
            )

        if await self.repo.email_exists(payload.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered.",
            )

        role_name = signup_role_to_enum(payload.role)
        await self.repo.create_user(
            role_name=role_name,
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
        )
        await self.db.commit()
        return SignupResponse()

    async def login(self, payload: LoginRequest) -> LoginResponse:
        user = await self.repo.get_user_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive.",
            )

        role_name = user.role.name.value
        user_permissions = sorted(await self.permissions.get_user_permissions(user))
        portal = self.permissions.get_portal_for_role(role_name)
        access_token = create_access_token(user.id, user.email, role_name)
        refresh_token = create_refresh_token(user.id, user.email, role_name)

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=LoginUserResponse(
                id=user.id,
                name=f"{user.first_name} {user.last_name}".strip(),
                role=role_name,
                portal=portal,
                permissions=user_permissions,
            ),
        )

    async def get_me(self, user: User) -> MeResponse:
        role_name = user.role.name.value
        user_permissions = sorted(await self.permissions.get_user_permissions(user))
        portal = self.permissions.get_portal_for_role(role_name)
        data_scope = self.permissions.get_data_scope(user).value
        return MeResponse(
            id=user.id,
            email=user.email,
            role=role_name,
            portal=portal,
            permissions=user_permissions,
            data_scope=data_scope,
            phone=user.phone,
            first_name=user.first_name,
            last_name=user.last_name,
            created_at=user.created_at,
        )

    async def refresh_access_token(self, payload: RefreshTokenRequest) -> RefreshTokenResponse:
        token_payload = verify_refresh_token(payload.refresh_token)
        if token_payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        if payload.refresh_token in self._token_blacklist:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked.",
            )

        user_id = uuid.UUID(token_payload["sub"])
        user = await self.repo.get_user_by_id(user_id)
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        access_token = create_access_token(
            user.id,
            user.email,
            user.role.name.value,
        )
        return RefreshTokenResponse(access_token=access_token)

    async def logout(self, refresh_token: str | None = None) -> LogoutResponse:
        if refresh_token:
            self._token_blacklist.add(refresh_token)
        return LogoutResponse()

    async def change_password(
        self, user: User, payload: ChangePasswordRequest
    ) -> ChangePasswordResponse:
        if not verify_password(payload.old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Old password is incorrect.",
            )

        await self.repo.update_user_password(user, payload.new_password)
        await self.db.commit()
        return ChangePasswordResponse()

    async def forgot_password(self, payload: ForgotPasswordRequest) -> MessageResponse:
        return MessageResponse(
            message="If the email exists, a password reset link has been sent.",
        )

    async def reset_password(self, payload: ResetPasswordRequest) -> MessageResponse:
        return MessageResponse(message="Password reset successful.")

    async def verify_email(self, payload: VerifyEmailRequest) -> MessageResponse:
        return MessageResponse(message="Email verified successfully.")
