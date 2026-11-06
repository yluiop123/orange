"""Environment-driven configuration.

Only the variables listed in ``docs/PORTING.md`` are required; the rest have
safe development defaults so the service can start locally without a config
file. No credential is ever hard-coded into the connection URL.

Connection precedence
---------------------
1. ``DATABASE_URL`` — a complete SQLAlchemy (or plain driver) URL. When set it
   wins; the discrete ``DB_*`` values are ignored.
2. ``DB_DRIVER`` + the discrete ``DB_*`` values — the URL is assembled here.
3. Neither — the PostgreSQL default (``localhost:5432``, ``orange``,
   ``postgres``/``postgres``) is used, matching the original behaviour.

``DATABASE_URL`` also tolerates the short forms used by other stacks in this
repository (``postgres://``, ``mysql://``, ``mariadb://``, ``sqlite://``); the
driver-specific scheme SQLAlchemy needs is filled in. A bare path is treated as
a SQLite file.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from urllib.parse import quote_plus

from dotenv import load_dotenv

# Local configuration; absent in containers that inject env vars.
load_dotenv(".env")

# Shared development fallback. Production must override it.
DEV_JWT_SECRET = "orange-dev-secret-change-me-in-production"

DRIVER_ALIASES = {
    "postgres": "postgres",
    "postgresql": "postgres",
    "pgsql": "postgres",
    "mysql": "mysql",
    "mariadb": "mariadb",
    "sqlite": "sqlite",
    "sqlite3": "sqlite",
}

MYSQL_DRIVERS = {"mysql", "mariadb"}


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


def _driver_from_url(url: str) -> str | None:
    if not url or "://" not in url:
        return None
    scheme = url.split("://", 1)[0].strip().lower()
    if scheme.startswith("postgres") or scheme in {"psycopg"}:
        return "postgres"
    if scheme.startswith("mysql"):
        return "mysql"
    if scheme.startswith("mariadb"):
        return "mariadb"
    if scheme.startswith("sqlite"):
        return "sqlite"
    return None


def _driver() -> str:
    raw = _env("DB_DRIVER", "").strip().lower()
    if raw:
        driver = DRIVER_ALIASES.get(raw)
        if driver is None:
            allowed = ", ".join(sorted(DRIVER_ALIASES))
            raise ValueError(f"DB_DRIVER must be one of {allowed}, got {raw!r}")
        return driver
    # With only DATABASE_URL set, infer the driver so engine options still work.
    return _driver_from_url(_env("DATABASE_URL", "").strip()) or "postgres"


def _default_port() -> int:
    return 3306 if _driver() in MYSQL_DRIVERS else 5432


def _default_user() -> str:
    return "root" if _driver() in MYSQL_DRIVERS else "postgres"


def _default_password() -> str:
    return "root" if _driver() in MYSQL_DRIVERS else "postgres"


def _default_name() -> str:
    return "orange-fastapi.db" if _driver() == "sqlite" else "orange"


def sqlite_url(path: str) -> str:
    """Build a ``sqlite+pysqlite`` URL for a file path or ``:memory:``."""
    value = (path or "").strip()
    if value in {":memory:", "file::memory:"}:
        return "sqlite+pysqlite:///:memory:"
    if "://" in value:
        scheme, rest = value.split("://", 1)
        if scheme.lower().split("+", 1)[0] == "sqlite":
            return "sqlite+pysqlite://" + rest
        raise ValueError(f"not a SQLite URL: {value!r}")
    # Windows paths must be URL separators, not backslashes.
    normalized = value.replace("\\", "/")
    return f"sqlite+pysqlite:///{normalized}"


def normalize_database_url(url: str) -> str:
    """Map the shared plain-driver URL forms onto SQLAlchemy's dialect names."""
    value = (url or "").strip()
    if not value:
        raise ValueError("DATABASE_URL must not be blank")
    if "://" not in value:
        return sqlite_url(value)

    scheme, rest = value.split("://", 1)
    lowered = scheme.lower()

    if lowered.split("+", 1)[0] == "sqlite":
        return "sqlite+pysqlite://" + rest

    if lowered in {
        "postgres",
        "postgresql",
        "postgresql+psycopg",
        "postgresql+psycopg2",
    }:
        return "postgresql+psycopg://" + rest

    if lowered.split("+", 1)[0] in {"mysql", "mariadb"}:
        result = "mysql+pymysql://" + rest
        if "charset=" not in result:
            result += "&charset=utf8mb4" if "?" in result else "?charset=utf8mb4"
        return result

    return value


@dataclass(frozen=True)
class Settings:
    # Database
    db_driver: str = field(default_factory=_driver)
    database_url_override: str | None = field(
        default_factory=lambda: _env("DATABASE_URL", "").strip() or None
    )
    db_host: str = field(default_factory=lambda: _env("DB_HOST", "localhost"))
    db_port: int = field(default_factory=lambda: _env_int("DB_PORT", _default_port()))
    db_name: str = field(default_factory=lambda: _env("DB_NAME", _default_name()))
    db_user: str = field(default_factory=lambda: _env("DB_USER", _default_user()))
    db_password: str = field(
        default_factory=lambda: _env("DB_PASSWORD", _default_password())
    )

    # JWT / sessions
    jwt_secret: str = field(
        default_factory=lambda: _env("JWT_SECRET", DEV_JWT_SECRET)
    )
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = field(default_factory=lambda: _env("JWT_ISSUER", "orange"))
    access_token_expire_seconds: int = field(
        default_factory=lambda: _env_int(
            "JWT_ACCESS_EXPIRE", _env_int("ACCESS_TOKEN_EXPIRE_SECONDS", 900)
        )
    )
    refresh_token_expire_seconds: int = field(
        default_factory=lambda: _env_int(
            "JWT_REFRESH_EXPIRE", _env_int("REFRESH_TOKEN_EXPIRE_SECONDS", 604800)
        )
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
    port: int = field(default_factory=lambda: _env_int("APP_PORT", _env_int("PORT", 8000)))
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            origin.strip()
            for origin in _env(
                "CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:4200"
            ).split(",")
            if origin.strip()
        )
    )

    # Operation log retention
    operation_log_retention_days: int = field(
        default_factory=lambda: _env_int(
            "LOG_RETENTION_DAYS", _env_int("OPERATION_LOG_RETENTION_DAYS", 90)
        )
    )

    def __post_init__(self) -> None:
        environment = (os.getenv("APP_ENV") or "local").lower()
        if environment in {"production", "prod"} and self.jwt_secret == DEV_JWT_SECRET:
            raise RuntimeError(
                "JWT_SECRET must be set to a non-default value in production"
            )

    @property
    def database_url(self) -> str:
        """Resolved SQLAlchemy URL, following the documented precedence."""
        if self.database_url_override:
            return normalize_database_url(self.database_url_override)

        if self.db_driver == "sqlite":
            return sqlite_url(self.db_name)

        user = quote_plus(self.db_user)
        password = quote_plus(self.db_password)
        if self.db_driver in MYSQL_DRIVERS:
            return (
                f"mysql+pymysql://{user}:{password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
            )
        return (
            f"postgresql+psycopg://{user}:{password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def resolved_driver(self) -> str:
        """Driver of the effective URL (``DATABASE_URL`` may override it)."""
        from_url = _driver_from_url(self.database_url)
        return from_url or self.db_driver


settings = Settings()
