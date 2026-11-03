from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.middleware as middleware_module
from app.db import get_db
from app.main import app
from app.models import Base, Group, Permission, Role, User
from app.security.passwords import hash_password


@pytest.fixture()
def db_session_factory():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
    )
    yield factory
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def seeded(db_session_factory):
    session: Session = db_session_factory()
    try:
        session.add_all(
            [
                Group(id="00", name="Headquarters", status="1"),
                Group(id="0001", name="HR", status="1", parent_id="00"),
            ]
        )
        permissions = [
            Permission(id="0000", name="Dashboard", path="/dashboard", type="directory", status="1"),
            Permission(id="0005", name="System", path="/system", type="menu", status="1"),
            Permission(id="000500", name="Users", path="/system/user", type="menu", status="1", parent_id="0005"),
            Permission(id="00050000", name="Add", path="/system/user", action="add", type="action", status="1", parent_id="000500"),
            Permission(id="00050001", name="Delete", path="/system/user", action="delete", type="action", status="1", parent_id="000500"),
            Permission(id="00050002", name="Edit", path="/system/user", action="edit", type="action", status="1", parent_id="000500"),
            Permission(id="000501", name="Roles", path="/system/role", type="menu", status="1", parent_id="0005"),
            Permission(id="00050100", name="Add", path="/system/role", action="add", type="action", status="1", parent_id="000501"),
            Permission(id="00050101", name="Delete", path="/system/role", action="delete", type="action", status="1", parent_id="000501"),
            Permission(id="00050102", name="Edit role", path="/system/role", action="edit", type="action", status="1", parent_id="000501"),
            Permission(id="000502", name="Groups", path="/system/group", type="menu", status="1", parent_id="0005"),
            Permission(id="00050200", name="Add", path="/system/group", action="add", type="action", status="1", parent_id="000502"),
            Permission(id="00050201", name="Delete", path="/system/group", action="delete", type="action", status="1", parent_id="000502"),
            Permission(id="00050202", name="Edit", path="/system/group", action="edit", type="action", status="1", parent_id="000502"),
            Permission(id="000503", name="Permissions", path="/system/permission", type="menu", status="1", parent_id="0005"),
            Permission(id="00050300", name="Add", path="/system/permission", action="add", type="action", status="1", parent_id="000503"),
            Permission(id="00050301", name="Delete", path="/system/permission", action="delete", type="action", status="1", parent_id="000503"),
            Permission(id="00050302", name="Edit", path="/system/permission", action="edit", type="action", status="1", parent_id="000503"),
            Permission(id="000504", name="Logs", path="/system/operation-log", type="menu", status="1", parent_id="0005"),
            Permission(id="000505", name="Profile", path="/profile", type="menu", status="1"),
        ]
        session.add_all(permissions)

        super_role = Role(id="super", name="Super", status="1")
        super_role.permissions = list(permissions)
        user_role = Role(id="user", name="User", status="1")
        user_role.permissions = [permissions[0]]
        session.add_all([super_role, user_role])

        super_user = User(
            id="user-super",
            name="Super",
            username="super",
            email="super@example.com",
            group_id="00",
            phone="13000000001",
            status="1",
            password=hash_password("super"),
            token_version=0,
            must_change_password=False,
        )
        super_user.roles = [super_role]
        super_user.permissions = [permissions[-1]]

        plain_user = User(
            id="user-plain",
            name="Plain",
            username="plain",
            email="plain@example.com",
            group_id="0001",
            phone="13000000002",
            status="1",
            password=hash_password("plain"),
            token_version=0,
            must_change_password=False,
        )
        plain_user.roles = [user_role]
        session.add_all([super_user, plain_user])
        session.commit()
        return session
    finally:
        session.close()


@pytest.fixture()
def client(db_session_factory, seeded, monkeypatch):
    def override_get_db():
        session = db_session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(middleware_module, "SessionLocal", db_session_factory)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def login(client: TestClient, username: str, password: str):
    return client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )


@pytest.fixture()
def super_token(client: TestClient) -> str:
    response = login(client, "super", "super")
    assert response.status_code == 200, response.text
    return response.json()["data"]["token"]


@pytest.fixture()
def auth_headers(super_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {super_token}"}
