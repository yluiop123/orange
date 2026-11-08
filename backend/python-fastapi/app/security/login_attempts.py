"""Database-backed login lockout.

Five failures per username and twenty per IP inside a fifteen minute window,
each locking for fifteen minutes. The counters live in ``sys_login_attempt`` so
every instance shares them.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Protocol

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.models import LoginAttempt

IP_PREFIX = "ip:"
USER_PREFIX = "user:"


def _aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class AttemptRepository(Protocol):
    def get(self, key: str) -> LoginAttempt | None: ...

    def add(self, row: LoginAttempt) -> None: ...

    def commit(self) -> None: ...

    def rollback(self) -> None: ...

    def delete(self, key: str) -> None: ...


class SqlAlchemyAttemptRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, key: str) -> LoginAttempt | None:
        return self._db.get(LoginAttempt, key)

    def add(self, row: LoginAttempt) -> None:
        self._db.add(row)

    def commit(self) -> None:
        self._db.commit()

    def rollback(self) -> None:
        self._db.rollback()

    def delete(self, key: str) -> None:
        row = self._db.get(LoginAttempt, key)
        if row is not None:
            self._db.delete(row)
            self._db.commit()


class LoginAttemptService:
    def __init__(
        self,
        repository: AttemptRepository,
        user_max_attempts: int | None = None,
        ip_max_attempts: int | None = None,
        lock_minutes: int | None = None,
    ) -> None:
        self._repository = repository
        self._user_max_attempts = (
            settings.login_max_attempts if user_max_attempts is None else user_max_attempts
        )
        self._ip_max_attempts = (
            settings.login_ip_max_attempts if ip_max_attempts is None else ip_max_attempts
        )
        self._lock = timedelta(
            minutes=settings.login_lock_minutes if lock_minutes is None else lock_minutes
        )

    # --- keys ---------------------------------------------------------
    @staticmethod
    def ip_key(ip: str | None) -> str:
        return IP_PREFIX + (ip or "").strip()

    @staticmethod
    def user_key(username: str | None) -> str:
        return USER_PREFIX + (username or "").strip().lower()

    # --- queries ------------------------------------------------------
    def is_blocked(self, ip: str | None, username: str | None) -> bool:
        return self._locked(self.ip_key(ip)) or self._locked(self.user_key(username))

    def _locked(self, key: str) -> bool:
        row = self._repository.get(key)
        if row is None:
            return False
        locked_until = _aware(row.locked_until)
        return locked_until is not None and locked_until > datetime.now(timezone.utc)

    # --- mutations ----------------------------------------------------
    def on_failure(self, ip: str | None, username: str | None) -> None:
        # Two concurrent first failures can both insert the same key. The
        # second insert loses the race, so retry once after a rollback instead
        # of turning a failed login into a 409.
        for attempt in range(2):
            try:
                self._record(self.ip_key(ip), self._ip_max_attempts)
                self._record(self.user_key(username), self._user_max_attempts)
                self._repository.commit()
                return
            except IntegrityError:
                if attempt == 1:
                    raise
                self._repository.rollback()

    def on_success(self, ip: str | None, username: str | None) -> None:
        # Only the account key is cleared: a successful login must not reset
        # the IP counter an attacker is trying to exhaust.
        self._repository.delete(self.user_key(username))

    def clear_user_attempts(self, username: str | None) -> None:
        self._repository.delete(self.user_key(username))

    def _record(self, key: str, max_attempts: int) -> None:
        now = datetime.now(timezone.utc)
        row = self._repository.get(key)

        if row is None:
            row = LoginAttempt(
                attempt_key=key,
                failures=1,
                window_start=now,
                locked_until=now + self._lock if max_attempts <= 1 else None,
            )
            self._repository.add(row)
            return

        window_start = _aware(row.window_start)
        if window_start is None or window_start + self._lock < now:
            row.failures = 1
            row.window_start = now
            row.locked_until = None
        else:
            row.failures = (row.failures or 0) + 1

        if row.failures >= max_attempts:
            row.locked_until = now + self._lock
        row.update_time = now
        self._repository.add(row)
