from __future__ import annotations

from pydantic import Field

from app.schemas.common import CamelModel


class AddRoleIn(CamelModel):
    name: str = Field(min_length=2, max_length=50)
    id: str | None = Field(default=None, pattern=r"^[A-Za-z0-9_-]{2,32}$")
    permissions: list[str] | None = None


class EditRoleIn(CamelModel):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    status: str | None = Field(default=None, pattern=r"^(0|1)$")
    permissions: list[str] | None = None
