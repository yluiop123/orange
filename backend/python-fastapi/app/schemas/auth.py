from __future__ import annotations

import re

from pydantic import Field, field_validator

from app.schemas.common import CamelModel, NotBlank


class LoginIn(CamelModel):
    username: str = Field(min_length=4, max_length=50, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=1)

    @field_validator("password", mode="before")
    @classmethod
    def _password_to_string(cls, value: object) -> object:
        # The reference accepts JSON numbers (``123456``) as passwords.
        return str(value) if isinstance(value, (int, float)) else value


class ChangePasswordIn(CamelModel):
    old_password: NotBlank
    new_password: str = Field(min_length=8, max_length=64)

    @field_validator("new_password")
    @classmethod
    def _letters_and_digits(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("新密码需同时包含字母和数字")
        return value
