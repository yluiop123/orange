from app.services.operation_logs import (
    BODY_LIMIT,
    QUERY_LIMIT,
    client_ip,
    is_sensitive_path,
    query_string,
    sanitize_body,
    should_record,
)


def test_records_only_system_writes_and_password_changes():
    assert should_record("POST", "/api/v1/system/users") is True
    assert should_record("PATCH", "/api/v1/system/users/1") is True
    assert should_record("DELETE", "/api/v1/system/groups?ids=00") is True
    assert should_record("POST", "/api/v1/auth/change-password") is True
    assert should_record("POST", "/api/v1/auth/login") is False
    assert should_record("GET", "/api/v1/system/users") is False
    assert should_record("OPTIONS", "/api/v1/system/users") is False


def test_marks_password_and_token_paths_as_sensitive():
    assert is_sensitive_path("/api/v1/auth/login") is True
    assert is_sensitive_path("/api/v1/auth/refresh") is True
    assert is_sensitive_path("/api/v1/auth/change-password") is True
    assert is_sensitive_path("/api/v1/system/users/1/reset-password") is True
    assert is_sensitive_path("/api/v1/system/users") is False


def test_redacts_sensitive_json_fields_and_truncates():
    body = '{"password":"secret","token":"abc","name":"ok"}'

    redacted = sanitize_body(body)
    assert "secret" not in redacted
    assert "abc" not in redacted
    assert '"***"' in redacted
    assert "ok" in redacted
    assert len(sanitize_body("a" * 5000)) == BODY_LIMIT
    assert sanitize_body(None) is None


def test_truncates_query_string_and_resolves_client_ip():
    assert len(query_string("a" * 600)) == QUERY_LIMIT
    assert query_string(None) is None

    assert client_ip({"x-forwarded-for": "203.0.113.1, 10.0.0.1"}, "127.0.0.1") == (
        "203.0.113.1"
    )
    assert client_ip({}, "127.0.0.1") == "127.0.0.1"
