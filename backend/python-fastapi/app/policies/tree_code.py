"""Tree code rules: digits only, fixed root length, child = parent + 2 digits."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.errors import invalid

_DIGITS = re.compile(r"^[0-9]+$")


@dataclass(frozen=True)
class TreeCodePolicy:
    root_length: int
    segment_length: int
    label: str

    def validate(self, code: str | None, parent_id: str | None) -> None:
        if code is None or not code.strip():
            raise invalid(f"{self.label}编码不能为空")
        if not _DIGITS.match(code):
            raise invalid(f"{self.label}编码只能包含数字")

        parent = (parent_id or "").strip() or None
        if parent is None:
            if len(code) != self.root_length:
                raise invalid(f"{self.label}编码长度必须为{self.root_length}")
            return

        expected = len(parent) + self.segment_length
        if len(code) != expected:
            raise invalid(f"{self.label}编码长度必须为{expected}")
        if not code.startswith(parent):
            raise invalid(f"{self.label}编码必须以{parent}开头")


GROUP = TreeCodePolicy(root_length=2, segment_length=2, label="组织")
PERMISSION = TreeCodePolicy(root_length=4, segment_length=2, label="权限")
