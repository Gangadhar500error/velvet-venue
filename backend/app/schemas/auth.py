import re
import uuid
from datetime import datetime
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.role import RoleName
from app.utils.password import validate_password_strength

SignupRole = Literal["customer", "vendor"]
PHONE_PATTERN = re.compile(r"^\+?[0-9]{7,15}$")


class SignupRequest(BaseModel):
    role: SignupRole = Field(..., examples=["customer"])
    first_name: str = Field(..., min_length=1, max_length=100, examples=["John"])
    last_name: str = Field(..., min_length=1, max_length=100, examples=["Doe"])
    email: EmailStr = Field(..., examples=["john.doe@example.com"])
    phone: str | None = Field(default=None, examples=["+1234567890"])
    password: str = Field(..., min_length=8, examples=["SecurePass123"])
    confirm_password: str = Field(..., min_length=8, examples=["SecurePass123"])

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_names(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower().strip()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        cleaned = value.strip()
        if not PHONE_PATTERN.match(cleaned):
            raise ValueError("Phone number must be 7-15 digits and may start with +.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @model_validator(mode="after")
    def passwords_match(self) -> Self:
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class SignupResponse(BaseModel):
    success: bool = True
    message: str = "Registration successful."


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["customer@velvetvenues.com"])
    password: str = Field(..., min_length=1, examples=["Customer@123"])

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower().strip()


class LoginUserResponse(BaseModel):
    id: uuid.UUID
    name: str
    role: str
    portal: str
    permissions: list[str] = Field(default_factory=list)
    customer_id: uuid.UUID | None = None
    customer_code: str | None = None
    venue_owner_id: uuid.UUID | None = None
    owner_code: str | None = None


class LoginResponse(BaseModel):
    success: bool = True
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: LoginUserResponse


class MeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool = True
    id: uuid.UUID
    email: str
    role: str
    portal: str
    permissions: list[str] = Field(default_factory=list)
    data_scope: str
    phone: str | None
    first_name: str
    last_name: str
    created_at: datetime
    customer_id: uuid.UUID | None = None
    customer_code: str | None = None
    venue_owner_id: uuid.UUID | None = None
    owner_code: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class RefreshTokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "Bearer"


class LogoutResponse(BaseModel):
    success: bool = True
    message: str = "Logged out successfully."


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @model_validator(mode="after")
    def passwords_match(self) -> Self:
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        if self.old_password == self.new_password:
            raise ValueError("New password must be different from the old password.")
        return self


class ChangePasswordResponse(BaseModel):
    success: bool = True
    message: str = "Password changed successfully."


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., examples=["user@example.com"])

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower().strip()


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @model_validator(mode="after")
    def passwords_match(self) -> Self:
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    success: bool = True
    message: str


def signup_role_to_enum(role: SignupRole) -> RoleName:
    return RoleName.VENDOR if role == "vendor" else RoleName.CUSTOMER
