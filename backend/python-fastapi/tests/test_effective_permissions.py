from types import SimpleNamespace

from app.policies.effective_permissions import EffectivePermissions, authority_of


def permission(pid, type_, path, action, status="1"):
    return SimpleNamespace(id=pid, type=type_, path=path, action=action, status=status)


def role(rid, *permissions, status="1"):
    return SimpleNamespace(id=rid, name=rid, status=status, permissions=list(permissions))


def test_merges_enabled_roles_and_direct_grants_and_skips_disabled():
    menu = permission("000500", "menu", "/system/user", None)
    add = permission("00050000", "action", "/system/user", "add")
    disabled_action = permission("00050001", "action", "/system/user", "delete", "0")
    direct = permission("000001", "menu", "/profile", None)

    admin = role("admin", menu, add, disabled_action)
    disabled_role = role("guest", permission("001", "menu", "/guest", None), status="0")

    user = SimpleNamespace(roles=[admin, disabled_role], permissions=[direct])

    effective = EffectivePermissions.of(user)

    assert [item.id for item in effective.roles] == ["admin"]
    assert {entry.role_id for entry in effective.role_permissions} == {"admin"}
    assert [item.id for item in effective.direct_permissions] == ["000001"]
    assert "000500" in effective.authorities
    assert "menu#/system/user" in effective.authorities
    assert "action#/system/user:add" in effective.authorities
    assert "000001" in effective.authorities
    assert "menu#/profile" in effective.authorities

    assert "00050001" not in effective.authorities
    assert "action#/system/user:delete" not in effective.authorities
    assert "001" not in effective.authorities
    assert "menu#/guest" not in effective.authorities


def test_direct_permission_already_granted_by_role_is_deduplicated():
    menu = permission("000500", "menu", "/system/user", None)
    user = SimpleNamespace(roles=[role("admin", menu)], permissions=[menu])

    effective = EffectivePermissions.of(user)

    assert effective.authorities.count("menu#/system/user") == 1
    assert len(effective.permissions) == 1


def test_authority_format_matches_controller_annotations():
    assert authority_of(permission("000500", "menu", "/system/user", None)) == (
        "menu#/system/user"
    )
    assert authority_of(permission("00050000", "action", "/system/user", "add")) == (
        "action#/system/user:add"
    )
    assert authority_of(permission("0000", "directory", "/dashboard", "  ")) == (
        "directory#/dashboard"
    )
