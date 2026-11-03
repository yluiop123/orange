"""Live PostgreSQL smoke test against a disposable ORANGE database.

Usage (from ``backend/python-fastapi``):

    DB_PORT=5432 DB_NAME=orange DB_USER=postgres DB_PASSWORD=postgres \
      python scripts/smoke_pg.py

It mutates the target database (creates and deletes an organisation, creates a
user). Point it at a scratch database only.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def expect(condition, label, extra=""):
    if not condition:
        raise AssertionError(f"{label} failed {extra}")
    print("ok -", label)


with TestClient(app) as client:
    unauth = client.get("/api/v1/auth/user-info")
    expect(unauth.status_code == 401, "unauthenticated 401")
    expect(unauth.json()["code"] == 40101, "unauthenticated envelope code")
    expect(unauth.headers.get("X-Trace-Id") == unauth.json()["traceId"], "trace header")

    login = client.post("/api/v1/auth/login", json={"username": "super", "password": "super"})
    expect(login.status_code == 200, "super login", login.text)
    token = login.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    expect(bool(client.cookies.get("refresh_token")), "refresh cookie set")

    info = client.get("/api/v1/auth/user-info", headers=headers)
    expect(info.status_code == 200, "user-info", info.text)
    expect(info.json()["data"]["username"] == "super", "user-info username")
    expect(any(r["id"] == "super" for r in info.json()["data"]["roles"]), "super role")

    menus = client.get("/api/v1/auth/menus", headers=headers)
    expect(menus.status_code == 200, "menus", menus.text)
    expect(len(menus.json()["data"]) > 0, "menus non-empty")

    for path in [
        "/api/v1/system/users?page=1&size=5",
        "/api/v1/system/roles?page=1&size=5",
        "/api/v1/system/groups",
        "/api/v1/system/permissions",
        "/api/v1/system/operation-logs?page=1&size=5",
    ]:
        response = client.get(path, headers=headers)
        expect(response.status_code == 200, f"list {path}", response.text)

    plain = client.post("/api/v1/auth/login", json={"username": "user", "password": "user"})
    expect(plain.status_code == 200, "plain login", plain.text)
    plain_headers = {"Authorization": f"Bearer {plain.json()['data']['token']}"}
    denied = client.get("/api/v1/system/users", headers=plain_headers)
    expect(denied.status_code == 403 and denied.json()["code"] == 40301, "40301 denied")

    created_group = client.post(
        "/api/v1/system/groups/children",
        headers={**headers, "X-Trace-Id": "pg-smoke-trace-01"},
        json={"id": "88", "name": "Smoke Group"},
    )
    expect(created_group.status_code == 200, "create group", created_group.text)
    deleted_group = client.delete("/api/v1/system/groups/88", headers=headers)
    expect(deleted_group.status_code == 200, "delete group", deleted_group.text)

    duplicate = client.post(
        "/api/v1/system/permissions/children",
        headers=headers,
        json={
            "id": "00050099",
            "name": "Dup",
            "path": "/system/user",
            "action": "add",
            "type": "action",
            "parentId": "000500",
        },
    )
    expect(duplicate.status_code == 409, "permission identity conflict", duplicate.text)

    logs = client.get(
        "/api/v1/system/operation-logs?path=/api/v1/system/groups&status=200",
        headers=headers,
    )
    expect(logs.status_code == 200, "operation log query", logs.text)
    rows = logs.json()["data"]["list"]
    expect(
        any(row["traceId"] == "pg-smoke-trace-01" for row in rows),
        "operation log trace id",
        str(rows[:2]),
    )

    created_user = client.post(
        "/api/v1/system/users",
        headers=headers,
        json={
            "name": "Smoke User",
            "username": "smokeuser",
            "email": "smoke@example.com",
            "groupId": "0001",
            "phone": "13900000001",
            "roles": ["user"],
            "permissions": [],
        },
    )
    expect(created_user.status_code == 200, "create user", created_user.text)
    temporary = created_user.json()["data"]
    expect(len(temporary) == 12, "temporary password length")

    temp_login = client.post(
        "/api/v1/auth/login", json={"username": "smokeuser", "password": temporary}
    )
    expect(temp_login.status_code == 200, "temp login", temp_login.text)
    temp_headers = {"Authorization": f"Bearer {temp_login.json()['data']['token']}"}
    blocked = client.get("/api/v1/system/users", headers=temp_headers)
    expect(blocked.status_code == 403 and blocked.json()["code"] == 40302, "40302 gate")

    old_refresh = client.cookies.get("refresh_token")
    rotated = client.post("/api/v1/auth/refresh")
    expect(rotated.status_code == 200, "refresh rotation", rotated.text)
    client.cookies.clear()
    replay = client.post(
        "/api/v1/auth/refresh", headers={"Cookie": f"refresh_token={old_refresh}"}
    )
    expect(replay.status_code == 401, "refresh replay rejected", replay.text)

    logout = client.post("/api/v1/auth/logout", headers=headers)
    expect(logout.status_code == 200, "logout", logout.text)
    after_logout = client.get("/api/v1/auth/user-info", headers=headers)
    expect(after_logout.status_code == 401, "access token revoked")

print("PG SMOKE PASSED")
