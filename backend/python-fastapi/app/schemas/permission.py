from __future__ import annotations

from pydantic import Field

from app.schemas.common import CamelModel, NotBlank


class AddChildPermissionIn(CamelModel):
    id: str = Field(pattern=r"^[0-9]{2,}$")
    name: NotBlank
    path: NotBlank
    action: str | None = None
    type: str = Field(pattern=r"^(menu|action|directory)$")
    parent_id: str | None = None


class EditPermissionIn(CamelModel):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    path: str | None = Field(default=None, max_length=200)
    action: str | None = None
    status: str | None = Field(default=None, pattern=r"^(0|1)$")
    type: str | None = Field(default=None, pattern=r"^(menu|action|directory)$")
