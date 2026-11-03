"""Environment-driven configuration.

Only the variables listed in ``docs/PORTING.md`` are required; the rest have
safe development defaults so the service can start locally without a config
file. No credential is ever hard-coded into the connection URL.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from urllib.parse import quote_plus


def _env(name: str, default: str) -> str:
    value = os.getenv(name)
    return default if value is None or value == "" else value


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError as exc:  # pragma: no cover - configuration error
        raise ValueError(f"{name} must be an integer, got {raw!r}") from exc


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    # Database
    db_host: str = field(default_factory=lambda: _env("DB_HOST", "localhost"))
    db_port: int = field(default_factory=lambda: _env_int("DB_PORT", 5432))
    db_name: str = field(default_factory=lambda: _env("DB_NAME", "orange"))
    db_user: str = field(default_factory=lambda: _env("DB_USER", "postgres"))
    db_password: str = field(default_factory=lambda: _env("DB_PASSWORD", "postgres"))

    # JWT / sessions
    jwt_secret: str = field(
        default_factory=lambda: _env("JWT_SECRET", "dev-only-insecure-secret-change-me")
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_seconds: int = field(
        default_factory=lambda: _env_int("ACCESS_TOKEN_EXPIRE_SECONDS", 900)
    )
    refresh_token_expire_seconds: int = field(
        default_factory=lambda: _env_int("REFRESH_TOKEN_EXPIRE_SECONDS", 604800)
    )

    # Refresh cookie
    cookie_secure: bool = field(default_factory=lambda: _env_bool("COOKIE_SECURE", False))
    cookie_same_site: str = field(default_factory=lambda: _env("COOKIE_SAME_SITE", "lax"))
    cookie_domain: str = field(default_factory=lambda: _env("COOKIE_DOMAIN", ""))
    cookie_path: str = "/api/v1/auth"

    # Login lockout
    login_max_attempts: int = field(
        default_factory=lambda: _env_int("LOGIN_MAX_ATTEMPTS", 5)
    )
    login_ip_max_attempts: int = field(
        default_factory=lambda: _env_int("LOGIN_IP_MAX_ATTEMPTS", 20)
    )
    login_lock_minutes: int = field(
        default_factory=lambda: _env_int("LOGIN_LOCK_MINUTES", 15)
    )

    # HTTP
    port: int = field(default_factory=lambda: _env_int("PORT", 8000))
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            origin.strip()
            for origin in _env(
                "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
            ).split(",")
            if origin.strip()
        )
    )

    # Operation log retention
    operation_log_retention_days: int = field(
        default_factory=lambda: _env_int("OPERATION_LOG_RETENTION_DAYS", 90)
    )

    @property
    def database_url(self) -> str:
        """SQLAlchemy URL using the psycopg 3 driver."""
        user = quote_plus(self.db_user)
        password = quote_plus(self.db_password)
        return (
            f"postgresql+psycopg://{user}:{password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


settings = Settings()
