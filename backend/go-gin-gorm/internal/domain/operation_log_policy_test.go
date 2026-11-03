package domain

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestShouldRecord(t *testing.T) {
	tests := []struct {
		method string
		path   string
		want   bool
	}{
		{"GET", "/api/v1/system/users", false},
		{"OPTIONS", "/api/v1/system/users", false},
		{"POST", "/api/v1/system/users", true},
		{"PATCH", "/api/v1/system/groups/00", true},
		{"DELETE", "/api/v1/system/roles/admin", true},
		{"POST", "/api/v1/auth/change-password", true},
		{"POST", "/api/v1/auth/login", false},
		{"POST", "/api/v1/auth/logout", false},
		{"GET", "/api/v1/system/operation-logs", false},
	}
	for _, test := range tests {
		if got := ShouldRecord(test.method, test.path); got != test.want {
			t.Fatalf("ShouldRecord(%q, %q) = %v, want %v", test.method, test.path, got, test.want)
		}
	}
}

func TestSanitizeBodyRedactsSecrets(t *testing.T) {
	body := `{"username":"admin","password":"hunter2","token":"abc","nested":{"secret":"x"},"name":"ok"}`
	sanitized := SanitizeBody(body)
	if sanitized == nil {
		t.Fatal("expected sanitized body")
	}
	for _, secret := range []string{"hunter2", `"abc"`, `"x"`} {
		if strings.Contains(*sanitized, secret) {
			t.Fatalf("sanitized body still contains %q: %s", secret, *sanitized)
		}
	}
	if !strings.Contains(*sanitized, `"name":"ok"`) {
		t.Fatalf("sanitized body lost safe field: %s", *sanitized)
	}
	if count := strings.Count(*sanitized, `"***"`); count != 3 {
		t.Fatalf("redaction count = %d, want 3: %s", count, *sanitized)
	}
}

func TestSanitizeBodyTruncates(t *testing.T) {
	body := strings.Repeat("a", OperationLogBodyLimit+500)
	sanitized := SanitizeBody(body)
	if sanitized == nil || len(*sanitized) != OperationLogBodyLimit {
		t.Fatalf("body length = %v, want %d", sanitized, OperationLogBodyLimit)
	}
}

func TestSanitizeBodyTruncatesUnicodeSafely(t *testing.T) {
	body := strings.Repeat("中", OperationLogBodyLimit+10)
	sanitized := SanitizeBody(body)
	if sanitized == nil {
		t.Fatal("expected sanitized body")
	}
	if runes := []rune(*sanitized); len(runes) != OperationLogBodyLimit {
		t.Fatalf("rune length = %d, want %d", len(runes), OperationLogBodyLimit)
	}
	if !utf8.ValidString(*sanitized) {
		t.Fatal("truncated body is not valid UTF-8")
	}
}

func TestBodyForLogSkipsSensitivePaths(t *testing.T) {
	for _, path := range []string{
		"/api/v1/auth/login",
		"/api/v1/auth/refresh",
		"/api/v1/auth/change-password",
		"/api/v1/system/users/abc/reset-password",
	} {
		if got := BodyForLog(path, `{"password":"x"}`); got != nil {
			t.Fatalf("BodyForLog(%q) = %v, want nil", path, *got)
		}
	}
	if got := BodyForLog("/api/v1/system/users", `{"name":"x"}`); got == nil {
		t.Fatal("expected non-sensitive body")
	}
}

func TestTruncateQuery(t *testing.T) {
	if got := TruncateQuery(""); got != nil {
		t.Fatalf("empty query = %v, want nil", got)
	}
	long := strings.Repeat("q", OperationLogQueryLimit+10)
	got := TruncateQuery(long)
	if got == nil || len(*got) != OperationLogQueryLimit {
		t.Fatalf("query length = %v, want %d", got, OperationLogQueryLimit)
	}
}

func TestClientIP(t *testing.T) {
	if got := ClientIP("203.0.113.7, 10.0.0.1", "127.0.0.1"); got != "203.0.113.7" {
		t.Fatalf("forwarded ip = %q", got)
	}
	if got := ClientIP("", "127.0.0.1"); got != "127.0.0.1" {
		t.Fatalf("remote ip = %q", got)
	}
}
