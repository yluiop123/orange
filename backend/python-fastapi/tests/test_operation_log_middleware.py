from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.middleware as middleware_module
from app.middleware import OperationLogMiddleware


class FakeSession:
    def __init__(self):
        self.committed = False

    def add(self, _row):
        pass

    def commit(self):
        self.committed = True

    def close(self):
        pass


def test_middleware_replays_the_body_and_records_the_write(monkeypatch):
    captured: dict = {}

    def fake_record(_session, **kwargs):
        captured.update(kwargs)

    monkeypatch.setattr(middleware_module, "SessionLocal", FakeSession)
    monkeypatch.setattr(middleware_module, "record", fake_record)

    probe = FastAPI()
    probe.add_middleware(OperationLogMiddleware)

    @probe.post("/api/v1/system/probe")
    async def echo(payload: dict) -> dict:
        return {"ok": True, "received": payload}

    response = TestClient(probe).post(
        "/api/v1/system/probe?x=1",
        json={"name": "demo", "password": "secret"},
        headers={"X-Forwarded-For": "203.0.113.9, 10.0.0.1"},
    )

    assert response.status_code == 200
    assert response.json()["received"] == {"name": "demo", "password": "secret"}
    assert captured["method"] == "POST"
    assert captured["path"] == "/api/v1/system/probe"
    assert captured["query"] == "x=1"
    assert captured["status"] == 200
    assert captured["ip"] == "203.0.113.9"
    assert "secret" in captured["body"]


def test_middleware_skips_reads_and_sensitive_paths(monkeypatch):
    captured: list[dict] = []
    monkeypatch.setattr(middleware_module, "SessionLocal", FakeSession)
    monkeypatch.setattr(
        middleware_module, "record", lambda _session, **kwargs: captured.append(kwargs)
    )

    probe = FastAPI()
    probe.add_middleware(OperationLogMiddleware)

    @probe.get("/api/v1/system/probe")
    async def read_probe() -> dict:
        return {"ok": True}

    @probe.post("/api/v1/system/users/1/reset-password")
    async def reset_probe(payload: dict) -> dict:
        return payload

    client = TestClient(probe)
    client.get("/api/v1/system/probe")
    client.post("/api/v1/system/users/1/reset-password", json={"password": "secret"})

    assert len(captured) == 1
    assert captured[0]["path"] == "/api/v1/system/users/1/reset-password"
    assert captured[0]["body"] is None
