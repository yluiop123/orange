from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.config import Settings, normalize_database_url, sqlite_url
from app.models import Base, OperationLog


def test_database_url_override_wins_over_discrete_values():
    settings = Settings(
        database_url_override="mariadb://root:root@localhost:53307/orange_fastapi",
        db_driver="postgres",
        db_host="ignored",
        db_port=1,
        db_name="ignored",
        db_user="ignored",
        db_password="ignored",
    )

    assert (
        settings.database_url
        == "mysql+pymysql://root:root@localhost:53307/orange_fastapi?charset=utf8mb4"
    )
    assert settings.resolved_driver == "mysql"


def test_discrete_values_build_the_driver_specific_url():
    postgres = Settings(
        database_url_override=None,
        db_driver="postgres",
        db_host="db",
        db_port=55432,
        db_name="orange",
        db_user="postgres",
        db_password="postgres",
    )
    assert (
        postgres.database_url
        == "postgresql+psycopg://postgres:postgres@db:55432/orange"
    )

    mysql = Settings(
        database_url_override=None,
        db_driver="mysql",
        db_host="db",
        db_port=53306,
        db_name="orange",
        db_user="root",
        db_password="root",
    )
    assert mysql.database_url == "mysql+pymysql://root:root@db:53306/orange?charset=utf8mb4"
    assert mysql.resolved_driver == "mysql"


def test_plain_and_sqlite_urls_are_normalised():
    assert normalize_database_url("postgres://u:p@h:5432/d") == (
        "postgresql+psycopg://u:p@h:5432/d"
    )
    assert normalize_database_url("mysql://u:p@h:3306/d") == (
        "mysql+pymysql://u:p@h:3306/d?charset=utf8mb4"
    )
    assert sqlite_url(":memory:") == "sqlite+pysqlite:///:memory:"
    assert sqlite_url(r"D:\data\orange.db") == "sqlite+pysqlite:///D:/data/orange.db"


def test_utc_timestamps_round_trip_as_aware_on_sqlite():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    moment = datetime.now(timezone.utc) - timedelta(minutes=5)

    with factory() as session:
        session.add(
            OperationLog(
                method="GET",
                path="/api/v1/health",
                status=200,
                duration_ms=1,
                create_time=moment,
            )
        )
        session.commit()

    with factory() as session:
        row = session.scalars(select(OperationLog)).one()
        assert row.create_time.tzinfo is timezone.utc
        assert abs((row.create_time - moment).total_seconds()) < 1

    engine.dispose()
