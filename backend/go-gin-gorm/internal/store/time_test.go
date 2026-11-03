package store

import (
	"testing"
	"time"
)

func TestParseStoreTimeFormats(t *testing.T) {
	// SQLite's CURRENT_TIMESTAMP, the driver's write format, RFC 3339 and the
	// PostgreSQL ISO output must all resolve to the same instant.
	expected := time.Date(2026, 11, 3, 12, 34, 56, 0, time.UTC)
	inputs := []string{
		"2026-11-03 12:34:56",
		"2026-11-03T12:34:56",
		"2026-11-03 12:34:56.000000000+00:00",
		"2026-11-03T12:34:56.000000000+00:00",
		"2026-11-03T12:34:56Z",
	}
	for _, input := range inputs {
		parsed, err := parseStoreTimeString(input)
		if err != nil {
			t.Fatalf("%q: %v", input, err)
		}
		if !parsed.Equal(expected) {
			t.Fatalf("%q parsed as %s, want %s", input, parsed, expected)
		}
	}
}

func TestParseStoreTimeBytesAndEmpty(t *testing.T) {
	parsed, err := parseStoreTime([]byte("2026-11-03 12:34:56"))
	if err != nil {
		t.Fatalf("bytes: %v", err)
	}
	if parsed.Year() != 2026 || parsed.Hour() != 12 {
		t.Fatalf("unexpected bytes parse: %s", parsed)
	}

	zero, err := parseStoreTimeString("")
	if err != nil || !zero.IsZero() {
		t.Fatalf("empty string: %s, %v", zero, err)
	}

	if _, err := parseStoreTimeString("not-a-date"); err == nil {
		t.Fatal("expected an error for an invalid timestamp")
	}
}

func TestEscapeLikeIsEngineNeutral(t *testing.T) {
	if got := likeContains("50%_off!"); got != "%50!%!_off!!%" {
		t.Fatalf("likeContains = %q", got)
	}
	if got := likePrefix("abc"); got != "abc%" {
		t.Fatalf("likePrefix = %q", got)
	}
}
