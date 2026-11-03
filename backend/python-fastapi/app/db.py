"""Database engine and request-scoped sessions.

The engine is built from :attr:`app.config.Settings.database_url`, so the same
code runs on PostgreSQL, MySQL, MariaDB and SQLite. Only pool/driver options
differ, and they are selected from the resolved URL rather than a second
configuration knob.
"""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

_IS_SQLITE = settings.database_url.startswith("sqlite")

_ENGINE_KWARGS: dict[str, object] = {"pool_pre_ping": True, "future": True}
if _IS_SQLITE:
    # ``sqlite3`` refuses cross-thread use by default while the sync endpoints
    # run in Starlette's worker threads; the timeout waits for the audit-log
    # writer instead of failing immediately with "database is locked".
    _ENGINE_KWARGS["connect_args"] = {"check_same_thread": False, "timeout": 15}
else:
    _ENGINE_KWARGS["pool_size"] = 10
    _ENGINE_KWARGS["max_overflow"] = 20

engine = create_engine(settings.database_url, **_ENGINE_KWARGS)

if _IS_SQLITE:

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection, _connection_record) -> None:
        """SQLite enforces foreign keys per connection, not per database."""
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys = ON")
            cursor.execute("PRAGMA busy_timeout = 15000")
        finally:
            cursor.close()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    future=True,
)


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a session that is always closed."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
