from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models import PermissionI18n


def _walk(nodes):
    for node in nodes:
        yield node
        yield from _walk(node["children"])


def _find(nodes, path):
    return next(node for node in _walk(nodes) if node["path"] == path)


def _add_translations(db_session_factory, rows):
    session = db_session_factory()
    try:
        session.add_all(
            PermissionI18n(permission_id=permission_id, locale=locale, name=name)
            for permission_id, locale, name in rows
        )
        session.commit()
    finally:
        session.close()


def _translation_rows(db_session_factory, permission_id):
    session = db_session_factory()
    try:
        return list(
            session.scalars(
                select(PermissionI18n).where(
                    PermissionI18n.permission_id == permission_id
                )
            )
        )
    finally:
        session.close()


def _create_menu(client: TestClient, auth_headers: dict[str, str], **overrides):
    payload = {
        "id": "000506",
        "name": "I18n Menu",
        "path": "/system/i18n",
        "type": "menu",
        "parentId": "0005",
        "translations": {"en": "I18n Menu", "zh-CN": "国际化菜单"},
    }
    payload.update(overrides)
    return client.post(
        "/api/v1/system/permissions/children",
        headers=auth_headers,
        json=payload,
    )


def test_menu_names_follow_exact_then_language_then_default_fallback(
    client: TestClient, auth_headers: dict[str, str], db_session_factory
):
    _add_translations(
        db_session_factory,
        [
            ("0000", "en-US", "Dashboard (US)"),
            ("0005", "en", "System (EN)"),
            ("0005", "zh", "系统"),
        ],
    )

    exact = client.get(
        "/api/v1/auth/menus", headers={**auth_headers, "Locale": "EN-us"}
    )
    assert exact.status_code == 200, exact.text
    tree = exact.json()["data"]
    assert _find(tree, "/dashboard")["name"] == "Dashboard (US)"
    assert _find(tree, "/system")["name"] == "System (EN)"
    # 000505 has no translation: sys_permission.name is the last resort.
    assert _find(tree, "/profile")["name"] == "Profile"

    language = client.get(
        "/api/v1/auth/menus", headers={**auth_headers, "Locale": "en-GB"}
    )
    assert language.status_code == 200, language.text
    tree = language.json()["data"]
    # 0000 only has en-US, so en-GB does not match it and falls back to name.
    assert _find(tree, "/dashboard")["name"] == "Dashboard"
    assert _find(tree, "/system")["name"] == "System (EN)"

    chinese = client.get(
        "/api/v1/auth/menus", headers={**auth_headers, "Locale": "zh-cn"}
    )
    assert chinese.status_code == 200, chinese.text
    tree = chinese.json()["data"]
    assert _find(tree, "/system")["name"] == "系统"
    assert _find(tree, "/dashboard")["name"] == "Dashboard"

    default = client.get("/api/v1/auth/menus", headers=auth_headers)
    assert default.status_code == 200, default.text
    assert _find(default.json()["data"], "/system")["name"] == "System"


def test_permission_translations_crud(client: TestClient, auth_headers: dict[str, str]):
    created = _create_menu(client, auth_headers)
    assert created.status_code == 200, created.text
    assert created.json()["data"]["translations"] == {
        "en": "I18n Menu",
        "zh-CN": "国际化菜单",
    }

    detail = client.get("/api/v1/system/permissions/000506", headers=auth_headers)
    assert detail.status_code == 200, detail.text
    assert detail.json()["data"]["name"] == "I18n Menu"
    assert detail.json()["data"]["translations"] == {
        "en": "I18n Menu",
        "zh-CN": "国际化菜单",
    }

    listed = client.get(
        "/api/v1/system/permissions?id=000506", headers=auth_headers
    )
    assert listed.status_code == 200, listed.text
    row = next(item for item in listed.json()["data"] if item["id"] == "000506")
    assert row["translations"] == {"en": "I18n Menu", "zh-CN": "国际化菜单"}

    # Supplying translations replaces the whole set, even for an existing locale.
    replaced = client.patch(
        "/api/v1/system/permissions/000506",
        headers=auth_headers,
        json={"translations": {"en": "Renamed"}},
    )
    assert replaced.status_code == 200, replaced.text
    detail = client.get("/api/v1/system/permissions/000506", headers=auth_headers)
    assert detail.json()["data"]["translations"] == {"en": "Renamed"}

    # Omitting translations keeps the stored rows; name stays the fallback.
    kept = client.patch(
        "/api/v1/system/permissions/000506",
        headers=auth_headers,
        json={"name": "Fallback Renamed"},
    )
    assert kept.status_code == 200, kept.text
    detail = client.get("/api/v1/system/permissions/000506", headers=auth_headers)
    assert detail.json()["data"]["name"] == "Fallback Renamed"
    assert detail.json()["data"]["translations"] == {"en": "Renamed"}

    # An explicit empty map clears every row.
    cleared = client.patch(
        "/api/v1/system/permissions/000506",
        headers=auth_headers,
        json={"translations": {}},
    )
    assert cleared.status_code == 200, cleared.text
    detail = client.get("/api/v1/system/permissions/000506", headers=auth_headers)
    assert detail.json()["data"]["translations"] == {}


def test_deleting_permission_removes_translation_rows(
    client: TestClient, auth_headers: dict[str, str], db_session_factory
):
    created = _create_menu(
        client,
        auth_headers,
        id="000507",
        path="/system/i18n-delete",
        translations={"en": "Temporary"},
    )
    assert created.status_code == 200, created.text
    assert len(_translation_rows(db_session_factory, "000507")) == 1

    deleted = client.delete(
        "/api/v1/system/permissions/000507", headers=auth_headers
    )
    assert deleted.status_code == 200, deleted.text
    assert _translation_rows(db_session_factory, "000507") == []


@pytest.mark.parametrize(
    "translations",
    [
        {"english": "Not a locale"},
        {"EN": "Upper-case language"},
        {"en": "   "},
        {"en": "x" * 256},
    ],
)
def test_translation_validation_rejects_bad_create_input(
    client: TestClient, auth_headers: dict[str, str], translations: dict[str, str]
):
    response = _create_menu(client, auth_headers, translations=translations)

    assert response.status_code == 400
    assert response.json()["code"] == 40002


def test_translation_validation_rejects_bad_edit_input(
    client: TestClient, auth_headers: dict[str, str]
):
    created = _create_menu(client, auth_headers)
    assert created.status_code == 200, created.text

    response = client.patch(
        "/api/v1/system/permissions/000506",
        headers=auth_headers,
        json={"translations": {"english": "Not a locale"}},
    )

    assert response.status_code == 400
    assert response.json()["code"] == 40002
