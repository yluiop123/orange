from __future__ import annotations

from pydantic import Field, field_validator

from app.schemas.common import EMAIL_PATTERN, CamelModel, NotBlank


class AddUserIn(CamelModel):
    name: str = Field(min_length=2, max_length=50)
    username: str = Field(min_length=4, max_length=50, pattern=r"^[A-Za-z0-9_]+$")
    email: str
    group_id: NotBlank
    phone: str = Field(pattern=r"^1[3-9]\d{9}$")
    status: str | None = Field(default=None, pattern=r"^(0|1)$")
    roles: list[str] | None = None
    permissions: list[str] | None = None

    @field_validator("email")
    @classmethod
    def _email_shape(cls, value: str) -> str:
        if not EMAIL_PATTERN.match(value):
            raise ValueError("邮箱格式不正确")
        return value


class EditUserIn(CamelModel):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    username: str | None = Field(
        default=None, min_length=4, max_length=50, pattern=r"^[A-Za-z0-9_]{4,50}$"
    )
    email: str | None = None
    group_id: str | None = None
    phone: str | None = Field(default=None, pattern=r"^1[3-9]\d{9}$")
    status: str | None = Field(default=None, pattern=r"^(0|1)$")
    roles: list[str] | None = None
    permissions: list[str] | None = None

    @field_validator("email")
    @classmethod
    def _email_shape(cls, value: str | None) -> str | None:
        if value in (None, ""):
            return value
        if not EMAIL_PATTERN.match(value):
            raise ValueError("邮箱格式不正确")
        return value
