from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_openapi_json_is_generated_from_the_fastapi_schema():
    with TestClient(app) as client:
        response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    document = response.json()
    assert document["openapi"].startswith("3.")
    assert "ORANGE API" in document["info"]["title"]
    assert "/api/v1/auth/login" in document["paths"]
    assert "/api/v1/auth/menus" in document["paths"]
    assert "LoginIn" in document["components"]["schemas"]


def test_swagger_page_is_served_by_fastapi():
    with TestClient(app) as client:
        response = client.get("/swagger")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    body = response.text
    assert "swagger-ui" in body
    assert "/openapi.json" in body
