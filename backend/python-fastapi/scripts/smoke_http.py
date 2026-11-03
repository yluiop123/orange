"""HTTP smoke test for one running ORANGE FastAPI backend.

Start the app with the engine under test, then run:

    python scripts/smoke_http.py --base-url http://127.0.0.1:8000

It logs in as ``super/super`` and checks the envelope, ``user-info``, ``menus``,
the users list and one group create/delete. It mutates only a throwaway group.
No third-party dependency: the standard library is enough.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

ENVELOPE_KEYS = {"code", "message", "data", "timestamp", "traceId"}


def expect(condition, label, extra=""):
    if not condition:
        raise AssertionError(f"{label} failed {extra}")
    print("ok -", label)


def call(base, method, path, token=None, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(base.rstrip("/") + path, data=data, method=method)
    request.add_header("Accept", "application/json")
    if data is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return (
                response.status,
                json.loads(response.read().decode("utf-8")),
                {key.lower(): value for key, value in response.headers.items()},
            )
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8")
        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError:
            parsed = {"raw": payload}
        return (
            exc.code,
            parsed,
            {key.lower(): value for key, value in exc.headers.items()},
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--user", default="super")
    parser.add_argument("--password", default="super")
    args = parser.parse_args()
    base = args.base_url

    status, body, headers = call(base, "GET", "/api/v1/auth/user-info")
    expect(status == 401, "unauthenticated returns 401", str(body))
    expect(body.get("code") == 40101, "unauthenticated envelope code")
    expect(set(body) == ENVELOPE_KEYS, "envelope keys", str(sorted(body)))
    expect(
        headers.get("x-trace-id") == body.get("traceId"),
        "trace header mirrors body",
    )

    status, body, _ = call(
        base,
        "POST",
        "/api/v1/auth/login",
        body={"username": args.user, "password": args.password},
    )
    expect(status == 200, "super login", str(body))
    token = body["data"]["token"]
    expect(bool(token), "access token")

    status, body, _ = call(base, "GET", "/api/v1/auth/user-info", token=token)
    expect(status == 200, "user-info", str(body))
    expect(body["data"]["username"] == args.user, "user-info username")

    status, body, _ = call(base, "GET", "/api/v1/auth/menus", token=token)
    expect(status == 200, "menus", str(body))
    expect(len(body["data"]) > 0, "menus non-empty")

    status, body, _ = call(
        base, "GET", "/api/v1/system/users?page=1&size=5", token=token
    )
    expect(status == 200, "users list", str(body))
    expect(body["data"]["total"] >= 1, "users list total")

    status, body, _ = call(base, "GET", "/api/v1/system/groups", token=token)
    expect(status == 200, "groups list", str(body))
    existing = {row["id"] for row in body["data"]}
    code = next(
        candidate
        for candidate in (f"{number:02d}" for number in range(99, 10, -1))
        if candidate not in existing
    )

    status, body, _ = call(
        base,
        "POST",
        "/api/v1/system/groups/children",
        token=token,
        body={"id": code, "name": f"Smoke {code}"},
    )
    expect(status == 200, "create group", str(body))
    expect(body["data"]["id"] == code, "created group id")

    status, body, _ = call(
        base, "DELETE", f"/api/v1/system/groups/{code}", token=token
    )
    expect(status == 200, "delete group", str(body))

    status, body, _ = call(
        base,
        "GET",
        "/api/v1/system/operation-logs?path=/api/v1/system/groups&status=200",
        token=token,
    )
    expect(status == 200, "operation-log query", str(body))
    expect(
        any(row["path"].endswith(f"/groups/{code}") for row in body["data"]["list"]),
        "operation log recorded the group write",
    )

    print("SMOKE PASSED", base)
    return 0


if __name__ == "__main__":
    sys.exit(main())
