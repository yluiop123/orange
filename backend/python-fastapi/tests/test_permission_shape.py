import pytest

from app.errors import ApiError
from app.policies.permission_shape import validate


@pytest.mark.parametrize(
    "type_,action",
    [
        ("action", "add"),
        ("menu", None),
        ("directory", ""),
        ("menu", "   "),
    ],
)
def test_valid_permission_shapes(type_, action):
    validate(type_, action)


@pytest.mark.parametrize(
    "type_,action",
    [
        ("action", None),
        ("action", ""),
        ("action", "   "),
        ("menu", "add"),
        ("directory", "edit"),
        ("unknown", None),
    ],
)
def test_invalid_permission_shapes(type_, action):
    with pytest.raises(ApiError):
        validate(type_, action)
