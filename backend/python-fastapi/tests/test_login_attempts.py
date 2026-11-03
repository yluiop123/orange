from datetime import datetime, timedelta, timezone

from app.models import LoginAttempt
from app.security.login_attempts import LoginAttemptService


class FakeAttemptRepository:
    def __init__(self):
        self.rows: dict[str, LoginAttempt] = {}
        self.commits = 0

    def get(self, key: str):
        return self.rows.get(key)

    def add(self, row: LoginAttempt) -> None:
        self.rows[row.attempt_key] = row

    def commit(self) -> None:
        self.commits += 1

    def delete(self, key: str) -> None:
        self.rows.pop(key, None)


def attempt(key, failures=0, window_start=None, locked_until=None):
    now = datetime.now(timezone.utc)
    return LoginAttempt(
        attempt_key=key,
        failures=failures,
        window_start=window_start or now,
        locked_until=locked_until,
    )


def build_service(user_max=2, ip_max=3):
    repository = FakeAttemptRepository()
    service = LoginAttemptService(
        repository,
        user_max_attempts=user_max,
        ip_max_attempts=ip_max,
        lock_minutes=15,
    )
    return service, repository


def test_is_blocked_uses_normalized_keys():
    service, repository = build_service()
    repository.add(
        attempt(
            "user:alice",
            failures=2,
            locked_until=datetime.now(timezone.utc) + timedelta(minutes=5),
        )
    )

    assert service.is_blocked(" 1.2.3.4 ", " Alice ") is True


def test_expired_lock_does_not_block():
    service, repository = build_service()
    repository.add(
        attempt(
            "user:alice",
            failures=2,
            locked_until=datetime.now(timezone.utc) - timedelta(seconds=1),
        )
    )

    assert service.is_blocked("1.2.3.4", "alice") is False


def test_on_failure_locks_user_and_ip_at_their_thresholds():
    service, repository = build_service()

    service.on_failure("1.2.3.4", "Alice")
    user = repository.rows[service.user_key("Alice")]
    ip = repository.rows[service.ip_key("1.2.3.4")]
    assert user.failures == 1
    assert user.locked_until is None
    assert ip.failures == 1

    service.on_failure("1.2.3.4", "alice")
    assert user.failures == 2
    assert user.locked_until is not None
    assert ip.failures == 2

    service.on_failure("1.2.3.4", "alice")
    assert ip.failures == 3
    assert ip.locked_until is not None
    assert repository.commits == 3
    assert service.is_blocked("1.2.3.4", "alice") is True


def test_successful_login_clears_only_the_user_counter():
    service, repository = build_service()
    repository.add(attempt("user:alice", failures=1))
    repository.add(attempt("ip:1.2.3.4", failures=1))

    service.on_success("1.2.3.4", "alice")

    assert "user:alice" not in repository.rows
    assert "ip:1.2.3.4" in repository.rows


def test_window_expiry_resets_the_failure_count():
    service, repository = build_service()
    repository.add(
        attempt(
            "user:alice",
            failures=1,
            window_start=datetime.now(timezone.utc) - timedelta(minutes=16),
        )
    )

    service.on_failure("9.9.9.9", "alice")

    assert repository.rows["user:alice"].failures == 1
    assert repository.rows["user:alice"].locked_until is None


def test_clear_user_attempts_removes_the_account_key():
    service, repository = build_service()
    repository.add(attempt("user:alice", failures=3))

    service.clear_user_attempts(" alice ")

    assert "user:alice" not in repository.rows
