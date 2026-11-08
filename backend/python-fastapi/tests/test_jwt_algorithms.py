"""The shared JWT rule: RSA pair -> RS256, otherwise JWT_SECRET -> HS256."""

from __future__ import annotations

import base64
import dataclasses
import json
from types import SimpleNamespace

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

import app.security.tokens as tokens
from app.config import settings


def _algorithm(token: str) -> str:
    header = token.split(".", 1)[0]
    padded = header + "=" * (-len(header) % 4)
    return json.loads(base64.urlsafe_b64decode(padded))["alg"]


def _user() -> SimpleNamespace:
    return SimpleNamespace(id="user-id", username="alice", token_version=3)


def test_hs256_round_trip(monkeypatch):
    fake = dataclasses.replace(
        settings,
        jwt_private_key=None,
        jwt_public_key=None,
        jwt_secret="a-32-byte-development-secret-key!!",
    )
    monkeypatch.setattr(tokens, "settings", fake)

    issued = tokens.create_token(_user(), tokens.ACCESS, 60)

    assert _algorithm(issued.token) == "HS256"
    claims = tokens.decode_token(issued.token, tokens.ACCESS)
    assert claims.subject == "user-id"
    assert claims.username == "alice"
    assert claims.version == 3


def test_rs256_round_trip(monkeypatch):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode("utf-8")
    public_pem = key.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")
    fake = dataclasses.replace(
        settings,
        jwt_private_key=private_pem,
        jwt_public_key=public_pem,
    )
    monkeypatch.setattr(tokens, "settings", fake)

    issued = tokens.create_token(_user(), tokens.ACCESS, 60)

    assert _algorithm(issued.token) == "RS256"
    claims = tokens.decode_token(issued.token, tokens.ACCESS)
    assert claims.subject == "user-id"
    assert claims.username == "alice"
    assert claims.version == 3
