import pytest

from app.errors import ApiError
from app.policies.tree_code import GROUP, PERMISSION

GROUP_VALID = [
    ("00", None),
    ("0001", "00"),
    ("000101", "0001"),
]
GROUP_INVALID = [
    ("", None),
    ("0a", None),
    ("0", None),
    ("001", "00"),
    ("0100", "00"),
]
PERMISSION_VALID = [
    ("0005", None),
    ("000501", "0005"),
    ("00050101", "000501"),
]
PERMISSION_INVALID = [
    ("", None),
    ("00a5", None),
    ("005", None),
    ("000502", "000501"),
    ("00050102", "000502"),
]


@pytest.mark.parametrize("code,parent", GROUP_VALID)
def test_group_codes_accept_root_and_child_shapes(code, parent):
    GROUP.validate(code, parent)


@pytest.mark.parametrize("code,parent", GROUP_INVALID)
def test_group_codes_reject_bad_shapes(code, parent):
    with pytest.raises(ApiError):
        GROUP.validate(code, parent)


@pytest.mark.parametrize("code,parent", PERMISSION_VALID)
def test_permission_codes_accept_root_and_child_shapes(code, parent):
    PERMISSION.validate(code, parent)


@pytest.mark.parametrize("code,parent", PERMISSION_INVALID)
def test_permission_codes_reject_bad_shapes(code, parent):
    with pytest.raises(ApiError):
        PERMISSION.validate(code, parent)


def test_policy_lengths_match_the_shared_fixture():
    assert GROUP.root_length == 2
    assert GROUP.segment_length == 2
    assert PERMISSION.root_length == 4
    assert PERMISSION.segment_length == 2


def test_blank_parent_is_treated_as_root():
    GROUP.validate("00", "   ")
    with pytest.raises(ApiError):
        GROUP.validate("0001", "   ")
