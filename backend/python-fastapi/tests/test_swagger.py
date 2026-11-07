from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import docs

REPO_ROOT = Path(__file__).resolve().parents[3]
CONTRACT = REPO_ROOT / "contracts" / "openapi.json"


@pytest.fixture()
def client():
    docs.load_contract()
    with TestClient(app) as test_client:
        yield test_client


def test_openapi_json_serves_the_repository_contract(client: TestClient):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == json.loads(CONTRACT.read_text(encoding="utf-8"))


def test_swagger_page_loads_swagger_ui_from_the_cdn(client: TestClient):
    response = client.get("/swagger")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    body = response.text
    assert "<title>Orange API</title>" in body
    assert "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" in body
    assert "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" in body
    assert "url:'/openapi.json'" in body
    assert "dom_id:'#swagger-ui'" in body
    assert "persistAuthorization:true" in body
    assert "docExpansion:'none'" in body


def test_docs_redirects_to_swagger(client: TestClient):
    response = client.get("/docs", follow_redirects=False)

    assert response.status_code == 302
    assert response.headers["location"] == "/swagger"


def test_missing_contract_returns_500(client: TestClient, monkeypatch):
    monkeypatch.setattr(docs, "locate_contract", lambda *args, **kwargs: None)
    monkeypatch.setattr(docs, "_contract_file", None)

    response = client.get("/openapi.json")

    assert response.status_code == 500


def test_locate_contract_walks_up_at_most_five_levels(tmp_path: Path):
    contract = tmp_path / "contracts" / "openapi.json"
    contract.parent.mkdir(parents=True)
    contract.write_text("{}", encoding="utf-8")

    five_levels = tmp_path
    for name in ("a", "b", "c", "d", "e"):
        five_levels = five_levels / name
        five_levels.mkdir()

    assert docs.locate_contract(five_levels) == contract.resolve()

    six_levels = five_levels / "f"
    six_levels.mkdir()
    assert docs.locate_contract(six_levels) is None
