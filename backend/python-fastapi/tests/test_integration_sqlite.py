from __future__ import annotations

from fastapi.testclient import TestClient


def login(client: TestClient, username: str, password: str):
    return client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )


def test_login_returns_token_and_rotating_refresh_cookie(client: TestClient):
    response = login(client, "super", "super")

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 200
    assert body["data"]["token"]
    assert body["data"]["status"] == "ok"
    assert body["data"]["expiresIn"] > 0
    assert body["data"]["refreshExpiresIn"] > 0
    assert client.cookies.get("refresh_token")
    set_cookie = response.headers.get("set-cookie", "")
    assert "HttpOnly" in set_cookie
    assert "Path=/api/v1/auth" in set_cookie

    old_refresh = client.cookies.get("refresh_token")
    refreshed = client.post("/api/v1/auth/refresh")
    assert refreshed.status_code == 200, refreshed.text
    assert refreshed.json()["data"]["token"]
    new_refresh = client.cookies.get("refresh_token")
    assert new_refresh and new_refresh != old_refresh

    client.cookies.clear()
    replay = client.post(
        "/api/v1/auth/refresh",
        headers={"Cookie": f"refresh_token={old_refresh}"},
    )
    assert replay.status_code == 401
    assert replay.json()["code"] == 40101


def test_login_failure_and_lockout_are_enveloped(client: TestClient):
    for _ in range(5):
        failed = login(client, "plain", "wrong")
        assert failed.status_code == 401
        assert failed.json()["code"] == 40101

    blocked = login(client, "plain", "plain")
    assert blocked.status_code == 429
    assert blocked.json()["code"] == 429


def test_user_info_and_menus(client: TestClient, auth_headers: dict[str, str]):
    info = client.get("/api/v1/auth/user-info", headers=auth_headers)
    assert info.status_code == 200, info.text
    data = info.json()["data"]
    assert data["username"] == "super"
    assert data["mustChangePassword"] is False
    assert {"id": "super", "name": "Super"} in data["roles"]
    assert any(item["path"] == "/system/user" for item in data["rolePermissions"])
    assert any(item["path"] == "/profile" for item in data["userPermissions"])

    menus = client.get("/api/v1/auth/menus", headers=auth_headers)
    assert menus.status_code == 200
    tree = menus.json()["data"]
    paths = [node["path"] for node in tree]
    assert "/dashboard" in paths
    assert "/system" in paths

    def walk(nodes):
        for node in nodes:
            assert node["type"] in {"menu", "directory"}
            walk(node["children"])

    walk(tree)
    system = next(node for node in tree if node["path"] == "/system")
    assert [child["id"] for child in system["children"]] == sorted(
        child["id"] for child in system["children"]
    )


def test_logout_revokes_the_access_token(client: TestClient, auth_headers: dict[str, str]):
    assert client.post("/api/v1/auth/logout", headers=auth_headers).status_code == 200
    after = client.get("/api/v1/auth/user-info", headers=auth_headers)
    assert after.status_code == 401
    assert after.json()["code"] == 40101


def test_missing_authority_returns_40301(client: TestClient):
    user_login = login(client, "plain", "plain")
    assert user_login.status_code == 200
    headers = {"Authorization": f"Bearer {user_login.json()['data']['token']}"}

    denied = client.get("/api/v1/system/users", headers=headers)
    assert denied.status_code == 403
    assert denied.json()["code"] == 40301


def test_forced_password_change_blocks_everything_but_the_allowlist(
    client: TestClient, auth_headers: dict[str, str]
):
    created = client.post(
        "/api/v1/system/users",
        headers=auth_headers,
        json={
            "name": "Temp User",
            "username": "tempuser",
            "email": "temp@example.com",
            "groupId": "0001",
            "phone": "13900000001",
            "status": "1",
            "roles": ["user"],
            "permissions": [],
        },
    )
    assert created.status_code == 200, created.text
    temporary = created.json()["data"]
    assert len(temporary) == 12

    temp_login = login(client, "tempuser", temporary)
    assert temp_login.status_code == 200
    temp_headers = {"Authorization": f"Bearer {temp_login.json()['data']['token']}"}

    blocked = client.get("/api/v1/system/users", headers=temp_headers)
    assert blocked.status_code == 403
    assert blocked.json()["code"] == 40302

    allowed = client.get("/api/v1/auth/user-info", headers=temp_headers)
    assert allowed.status_code == 200
    assert allowed.json()["data"]["mustChangePassword"] is True

    changed = client.post(
        "/api/v1/auth/change-password",
        headers=temp_headers,
        json={"oldPassword": temporary, "newPassword": "BrandNew123"},
    )
    assert changed.status_code == 200, changed.text

    relogin = login(client, "tempuser", "BrandNew123")
    assert relogin.status_code == 200
    new_headers = {"Authorization": f"Bearer {relogin.json()['data']['token']}"}
    assert client.get("/api/v1/system/users", headers=new_headers).status_code == 403


def test_list_endpoints_and_empty_query_filters(
    client: TestClient, auth_headers: dict[str, str]
):
    users = client.get(
        "/api/v1/system/users?keyword=&status=all&groupId=&page=1&size=10",
        headers=auth_headers,
    )
    assert users.status_code == 200, users.text
    assert users.json()["data"]["total"] == 2
    assert users.json()["data"]["totalPages"] == 1

    assert client.get("/api/v1/system/roles", headers=auth_headers).status_code == 200
    assert (
        client.get(
            "/api/v1/system/groups?id=&name=&status=", headers=auth_headers
        ).status_code
        == 200
    )
    assert (
        client.get(
            "/api/v1/system/permissions?id=&name=&path=&status=&type=",
            headers=auth_headers,
        ).status_code
        == 200
    )
    assert (
        client.get("/api/v1/system/operation-logs", headers=auth_headers).status_code
        == 200
    )


def test_permission_identity_conflict(client: TestClient, auth_headers: dict[str, str]):
    duplicate = client.post(
        "/api/v1/system/permissions/children",
        headers=auth_headers,
        json={
            "id": "00050003",
            "name": "Add duplicate",
            "path": "/system/user",
            "action": "add",
            "type": "action",
            "parentId": "000500",
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == 40901

    wrong_shape = client.post(
        "/api/v1/system/permissions/children",
        headers=auth_headers,
        json={
            "id": "00050004",
            "name": "Bad shape",
            "path": "/system/user",
            "action": "add",
            "type": "menu",
            "parentId": "000500",
        },
    )
    assert wrong_shape.status_code == 400


def test_reference_guards(client: TestClient, auth_headers: dict[str, str]):
    # Group has a user: deleting it is a conflict.
    group_delete = client.delete("/api/v1/system/groups/0001", headers=auth_headers)
    assert group_delete.status_code == 409

    # Role is referenced by a user.
    role_delete = client.delete("/api/v1/system/roles/user", headers=auth_headers)
    assert role_delete.status_code == 409

    # Permission is referenced by both roles and users.
    permission_delete = client.delete(
        "/api/v1/system/permissions/0000", headers=auth_headers
    )
    assert permission_delete.status_code == 409


def test_group_crud_and_role_user_grant_updates(
    client: TestClient, auth_headers: dict[str, str]
):
    created = client.post(
        "/api/v1/system/groups/children",
        headers=auth_headers,
        json={"id": "0002", "name": "Finance", "parentId": "00"},
    )
    assert created.status_code == 200, created.text
    assert created.json()["data"]["parentId"] == "00"

    renamed = client.patch(
        "/api/v1/system/groups/0002",
        headers=auth_headers,
        json={"name": "Finance 2"},
    )
    assert renamed.status_code == 200, renamed.text

    deleted = client.delete("/api/v1/system/groups/0002", headers=auth_headers)
    assert deleted.status_code == 200, deleted.text

    role = client.post(
        "/api/v1/system/roles",
        headers=auth_headers,
        json={"id": "ops", "name": "Ops", "permissions": ["000500"]},
    )
    assert role.status_code == 200, role.text
    assert role.json()["data"] == "ops"

    updated_role = client.patch(
        "/api/v1/system/roles/ops",
        headers=auth_headers,
        json={"name": "Operations", "permissions": ["000500", "000501"]},
    )
    assert updated_role.status_code == 200, updated_role.text
    detail = client.get("/api/v1/system/roles/ops", headers=auth_headers)
    assert sorted(detail.json()["data"]["permissions"]) == ["000500", "000501"]

    updated_user = client.patch(
        "/api/v1/system/users/user-plain",
        headers=auth_headers,
        json={"roles": ["ops"], "permissions": ["000505"]},
    )
    assert updated_user.status_code == 200, updated_user.text
    user_detail = client.get("/api/v1/system/users/user-plain", headers=auth_headers)
    assert [role["id"] for role in user_detail.json()["data"]["roles"]] == ["ops"]
    assert user_detail.json()["data"]["permissions"] == ["000505"]

    unassign = client.patch(
        "/api/v1/system/users/user-plain",
        headers=auth_headers,
        json={"roles": []},
    )
    assert unassign.status_code == 200, unassign.text

    assert (
        client.delete("/api/v1/system/roles/ops", headers=auth_headers).status_code == 200
    )


def test_operation_log_records_system_write_with_trace_and_redaction(
    client: TestClient, auth_headers: dict[str, str]
):
    trace_id = "integration-trace-01"
    response = client.patch(
        "/api/v1/system/groups/0001",
        headers={**auth_headers, "X-Trace-Id": trace_id},
        json={"name": "HR Renamed"},
    )
    assert response.status_code == 200, response.text

    logs = client.get(
        "/api/v1/system/operation-logs?path=/api/v1/system/groups&status=200",
        headers=auth_headers,
    )
    assert logs.status_code == 200, logs.text
    rows = logs.json()["data"]["list"]
    assert rows
    row = rows[0]
    assert row["traceId"] == trace_id
    assert row["path"] == "/api/v1/system/groups/0001"
    assert row["username"] == "super"
    assert row["method"] == "PATCH"
    assert "HR Renamed" in row["requestBody"]
