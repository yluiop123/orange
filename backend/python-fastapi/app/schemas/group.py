from __future__ import annotations

from pydantic import Field

from app.schemas.common import CamelModel, NotBlank


class AddChildGroupIn(CamelModel):
    id: str = Field(pattern=r"^[0-9]{2,}$")
    name: NotBlank
    parent_id: str | None = None


class EditGroupIn(CamelModel):
    name: NotBlank
    status: str | None = Field(default=None, pattern=r"^[01]$")
