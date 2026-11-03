package auth

import (
	"strings"
	"testing"
	"time"

	"github.com/orange/backend-go-gin-gorm/internal/config"
)

func testTokenService(t *testing.T) *TokenService {
	t.Helper()
	service, err := NewTokenService(config.JWT{
		Secret:     "unit-test-secret",
		AccessTTL:  time.Minute,
		RefreshTTL: time.Hour,
		Issuer:     "orange-test",
	})
	if err != nil {
		t.Fatalf("NewTokenService: %v", err)
	}
	return service
}

func TestTokenRoundTripAndType(t *testing.T) {
	service := testTokenService(t)
	access, err := service.IssueAccess("user-1", "super", 3)
	if err != nil {
		t.Fatalf("IssueAccess: %v", err)
	}
	claims, err := service.Parse(access.Value, TokenTypeAccess)
	if err != nil {
		t.Fatalf("Parse access: %v", err)
	}
	if claims.Subject != "user-1" || claims.Username != "super" || claims.Version != 3 {
		t.Fatalf("unexpected claims: %+v", claims)
	}
	if claims.ID != access.JTI {
		t.Fatalf("jti = %q, want %q", claims.ID, access.JTI)
	}
	if _, err := service.Parse(access.Value, TokenTypeRefresh); err == nil {
		t.Fatal("access token must not parse as refresh")
	}
}

func TestTokenRejectsTampering(t *testing.T) {
	service := testTokenService(t)
	access, err := service.IssueAccess("user-1", "super", 0)
	if err != nil {
		t.Fatalf("IssueAccess: %v", err)
	}
	parts := strings.Split(access.Value, ".")
	if len(parts) != 3 {
		t.Fatalf("unexpected token shape")
	}
	parts[2] = parts[2] + "x"
	if _, err := service.Parse(strings.Join(parts, "."), TokenTypeAccess); err == nil {
		t.Fatal("tampered token must be rejected")
	}
}

func TestTemporaryPassword(t *testing.T) {
	password, err := GenerateTemporaryPassword()
	if err != nil {
		t.Fatalf("GenerateTemporaryPassword: %v", err)
	}
	if len(password) != TemporaryPasswordLength {
		t.Fatalf("length = %d, want %d", len(password), TemporaryPasswordLength)
	}
	for _, r := range password {
		if !strings.ContainsRune(temporaryPasswordAlphabet, r) {
			t.Fatalf("unexpected character %q", r)
		}
	}
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if !strings.HasPrefix(hash, "{bcrypt}") {
		t.Fatalf("hash = %q, want {bcrypt} prefix for seed compatibility", hash)
	}
	if !CheckPassword(hash, password) {
		t.Fatal("hash must verify the password")
	}
	if CheckPassword(hash, password+"x") {
		t.Fatal("wrong password must not verify")
	}
	// The committed seed stores prefixed hashes; parsing must ignore the prefix.
	if !CheckPassword("{bcrypt}"+strings.TrimPrefix(hash, "{bcrypt}"), password) {
		t.Fatal("prefixed hash must verify")
	}
}
