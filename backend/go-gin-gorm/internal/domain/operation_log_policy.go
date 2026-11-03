package domain

import (
	"regexp"
	"strings"
)

const (
	OperationLogBodyLimit  = 4000
	OperationLogQueryLimit = 500
)

var sensitiveJSONField = regexp.MustCompile(`(?i)("[^"]*(?:password|token|secret)[^"]*"\s*:\s*)"(?:[^"\\]|\\.)*"`)

// ShouldRecord reports whether a request is audited: non-GET writes to system
// management endpoints and the password-change endpoint.
func ShouldRecord(method, path string) bool {
	if strings.EqualFold(method, "GET") || strings.EqualFold(method, "OPTIONS") {
		return false
	}
	return strings.HasPrefix(path, "/api/v1/system/") || path == "/api/v1/auth/change-password"
}

// IsSensitivePath marks requests whose body must never be stored.
func IsSensitivePath(path string) bool {
	lower := strings.ToLower(path)
	return strings.HasSuffix(lower, "/login") ||
		strings.HasSuffix(lower, "/refresh") ||
		strings.HasSuffix(lower, "/change-password") ||
		strings.HasSuffix(lower, "/reset-password")
}

// SanitizeBody redacts password/token/secret JSON fields and truncates the
// result to 4000 characters. An empty body is stored as NULL.
func SanitizeBody(body string) *string {
	if body == "" {
		return nil
	}
	redacted := sensitiveJSONField.ReplaceAllString(body, `$1"***"`)
	return stringPtr(truncateRunes(redacted, OperationLogBodyLimit))
}

// BodyForLog returns nil for sensitive paths, otherwise a sanitized body.
func BodyForLog(path, body string) *string {
	if IsSensitivePath(path) {
		return nil
	}
	return SanitizeBody(body)
}

func TruncateQuery(query string) *string {
	if query == "" {
		return nil
	}
	return stringPtr(truncateRunes(query, OperationLogQueryLimit))
}

// truncateRunes counts characters, not bytes, so a truncated Chinese body stays
// valid UTF-8 for PostgreSQL.
func truncateRunes(value string, limit int) string {
	runes := []rune(value)
	if len(runes) <= limit {
		return value
	}
	return string(runes[:limit])
}

func stringPtr(value string) *string { return &value }

func ClientIP(forwardedFor, remoteAddr string) string {
	if trimmed := strings.TrimSpace(forwardedFor); trimmed != "" {
		if comma := strings.IndexByte(trimmed, ','); comma >= 0 {
			return strings.TrimSpace(trimmed[:comma])
		}
		return trimmed
	}
	return remoteAddr
}
