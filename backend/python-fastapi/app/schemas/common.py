"""Shared Pydantic base classes and primitives."""

from __future__ import annotations

import re
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _not_blank(value: str) -> str:
    if not value or not value.strip():
        raise ValueError("must not be blank")
    return value


NotBlank = Annotated[str, AfterValidator(_not_blank)]


class CamelModel(BaseModel):
    """Accept and emit camelCase JSON while keeping snake_case Python fields."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="ignore",
    )


class StatusIn(CamelModel):
    status: str

    @field_validator("status")
    @classmethod
    def _status_is_boolean_flag(cls, value: str) -> str:
        if value not in {"0", "1"}:
            raise ValueError("状态只能是 0 或 1")
        return value
