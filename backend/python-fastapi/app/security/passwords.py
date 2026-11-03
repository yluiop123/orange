"""BCrypt password hashing and temporary password generation."""

from __future__ import annotations

import secrets
import string

import bcrypt

_BCRYPT_PREFIX = "{bcrypt}"
_TEMP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("ascii")


def verify_password(plain: str, stored: str | None) -> bool:
    """Verify a BCrypt hash, accepting the ``{bcrypt}`` id prefix used by seed data."""
    if not stored:
        return False
    value = stored
    if value.startswith(_BCRYPT_PREFIX):
        value = value[len(_BCRYPT_PREFIX) :]
    elif value.startswith("{"):
        # Unknown Spring delegating-encoder id: reject instead of guessing.
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), value.encode("ascii"))
    except (ValueError, TypeError):
        return False


def generate_temporary_password(length: int = 12) -> str:
    return "".join(secrets.choice(_TEMP_ALPHABET) for _ in range(length))


# Kept for completeness when a caller wants a symbol-bearing password.
_SYMBOLS = string.punctuation
