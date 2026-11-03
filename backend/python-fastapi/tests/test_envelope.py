from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.errors import register_exception_handlers
from app.main import app
from app.trace import TraceIdMiddleware

client = TestClient(app)

ENVELOPE_KEYS = {"code", "message", "data", "timestamp", "traceId"}


def test_unauthenticated_request_returns_envelope_with_trace_header():
    response = client.get(
        "/api/v1/auth/user-info",
        headers={"X-Trace-Id": "trace-abc-12345"},
    )

    assert response.status_code == 401
    body = response.json()
    assert set(body) == ENVELOPE_KEYS
    assert body["code"] == 40101
    assert body["traceId"] == "trace-abc-12345"
    assert response.headers["X-Trace-Id"] == "trace-abc-12345"
    assert response.headers["Content-Type"] == "application/json; charset=utf-8"
    assert isinstance(body["timestamp"], int)


def test_generated_trace_id_is_returned_in_body_and_header():
    response = client.get("/api/v1/auth/menus")

    body = response.json()
    assert response.status_code == 401
    assert body["traceId"]
    assert response.headers["X-Trace-Id"] == body["traceId"]
    assert len(body["traceId"]) == 16


def test_validation_error_uses_business_code_and_field_map():
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "ab", "password": ""},
    )

    assert response.status_code == 400
    body = response.json()
    assert set(body) == ENVELOPE_KEYS
    assert body["code"] == 40002
    assert "username" in body["data"]
    assert body["traceId"] == response.headers["X-Trace-Id"]


def test_unknown_route_returns_envelope_with_404_code():
    response = client.get("/api/v1/nope")

    assert response.status_code == 404
    body = response.json()
    assert set(body) == ENVELOPE_KEYS
    assert body["code"] == 40401


def test_malformed_json_returns_param_error():
    response = client.post(
        "/api/v1/auth/login",
        content="{not-json",
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == 40001


def test_method_not_allowed_uses_envelope():
    response = client.put("/api/v1/auth/login")

    assert response.status_code == 405
    assert response.json()["code"] == 40501
    assert response.headers["X-Trace-Id"] == response.json()["traceId"]


def test_legacy_trace_header_is_accepted():
    response = client.get(
        "/api/v1/auth/user-info",
        headers={"X-Request-Id": "legacy-trace-01"},
    )

    assert response.json()["traceId"] == "legacy-trace-01"
    assert response.headers["X-Trace-Id"] == "legacy-trace-01"


def test_cors_allows_the_configured_origin_with_credentials():
    response = client.options(
        "/api/v1/system/users",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"


def test_unhandled_error_keeps_the_supplied_trace_id():
    probe = FastAPI()
    register_exception_handlers(probe)
    probe.add_middleware(TraceIdMiddleware)

    @probe.get("/boom")
    def boom() -> dict:
        raise RuntimeError("bang")

    failing = TestClient(probe, raise_server_exceptions=False)
    response = failing.get("/boom", headers={"X-Trace-Id": "boom-trace-0001"})

    assert response.status_code == 500
    assert response.json()["code"] == 50000
    assert response.json()["traceId"] == "boom-trace-0001"
    assert response.headers["X-Trace-Id"] == "boom-trace-0001"
