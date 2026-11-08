from __future__ import annotations

from typing import Annotated

from pydantic import Field, StringConstraints

from app.schemas.common import CamelModel, NotBlank

# A BCP 47 style tag: lower-case language, optional region (``en``, ``en-US``).
TranslationLocale = Annotated[
    str, StringConstraints(pattern=r"^[a-z]{2}(-[A-Za-z]{2})?$")
]
TranslationName = Annotated[NotBlank, Field(max_length=255)]
Translations = dict[TranslationLocale, TranslationName]


class AddChildPermissionIn(CamelModel):
    id: str = Field(pattern=r"^[0-9]{2,}$")
    name: NotBlank
    path: NotBlank
    action: str | None = None
    type: str = Field(pattern=r"^(menu|action|directory)$")
    parent_id: str | None = None
    translations: Translations | None = None


class EditPermissionIn(CamelModel):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    path: str | None = Field(default=None, max_length=200)
    action: str | None = None
    status: str | None = Field(default=None, pattern=r"^(0|1)$")
    type: str | None = Field(default=None, pattern=r"^(menu|action|directory)$")
    translations: Translations | None = None
