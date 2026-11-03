package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/auth"
	"github.com/orange/backend-go-gin-gorm/internal/config"
	"github.com/orange/backend-go-gin-gorm/internal/service"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

// TestSmokeAgainstConfiguredDatabase is opt-in: set ORANGE_SMOKE=1 and point
// DB_DRIVER/DATABASE_URL (or DB_*) at a database seeded with the matching
// ddl.sql and dml.sql. It skips (never fails) when the database is unavailable.
func TestSmokeAgainstConfiguredDatabase(t *testing.T) {
	if os.Getenv("ORANGE_SMOKE") != "1" {
		t.Skip("set ORANGE_SMOKE=1 to run the database smoke test")
	}
	cfg := config.Load()
	dsn, err := cfg.Database.DSN()
	if err != nil {
		t.Skipf("invalid database configuration: %v", err)
	}
	st, err := store.Open(cfg.Database.Driver, dsn)
	if err != nil {
		t.Skipf("%s unavailable: %v", cfg.Database.Driver, err)
	}
	pingCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := st.Ping(pingCtx); err != nil {
		t.Skipf("%s unavailable: %v", cfg.Database.Driver, err)
	}

	tokens, err := auth.NewTokenService(cfg.JWT)
	if err != nil {
		t.Fatalf("token service: %v", err)
	}
	svc := service.New(st, tokens, cfg.Lockout)
	gin.SetMode(gin.TestMode)
	server := httptest.NewServer(NewRouter(svc, st, cfg))
	defer server.Close()

	client := server.Client()

	// 1. Unauthenticated request -> 401 with the envelope.
	response, body := doJSON(t, client, http.MethodGet, server.URL+"/api/v1/system/users", "", nil)
	if response.StatusCode != http.StatusUnauthorized || body.Code != 40101 {
		t.Fatalf("unauthenticated: status=%d code=%d", response.StatusCode, body.Code)
	}

	// 2. Login -> access token + HttpOnly refresh cookie.
	username := envOr("SMOKE_USERNAME", "super")
	password := envOr("SMOKE_PASSWORD", "super")
	loginBody := map[string]string{"username": username, "password": password}
	response, login := doJSON(t, client, http.MethodPost, server.URL+"/api/v1/auth/login", "", loginBody)
	if response.StatusCode != http.StatusOK {
		t.Fatalf("login: status=%d message=%s", response.StatusCode, login.Message)
	}
	token := tokenFrom(t, login.Data)
	if token == "" {
		t.Fatal("login returned an empty access token")
	}
	refreshCookie := findCookie(response, "refresh_token")
	if refreshCookie == nil || !refreshCookie.HttpOnly {
		t.Fatalf("refresh cookie missing or not HttpOnly: %+v", refreshCookie)
	}

	// 3. user-info and menus.
	response, info := doJSON(t, client, http.MethodGet, server.URL+"/api/v1/auth/user-info", token, nil)
	if response.StatusCode != http.StatusOK || info.Code != 200 {
		t.Fatalf("user-info: status=%d code=%d", response.StatusCode, info.Code)
	}
	response, menus := doJSON(t, client, http.MethodGet, server.URL+"/api/v1/auth/menus", token, nil)
	if response.StatusCode != http.StatusOK || menus.Code != 200 {
		t.Fatalf("menus: status=%d code=%d", response.StatusCode, menus.Code)
	}

	// 4. One list endpoint per resource.
	for _, path := range []string{
		"/api/v1/system/users",
		"/api/v1/system/roles",
		"/api/v1/system/groups",
		"/api/v1/system/permissions",
		"/api/v1/system/operation-logs",
	} {
		response, body := doJSON(t, client, http.MethodGet, server.URL+path, token, nil)
		if response.StatusCode != http.StatusOK || body.Code != 200 {
			t.Fatalf("%s: status=%d code=%d message=%s", path, response.StatusCode, body.Code, body.Message)
		}
	}

	// 5. Unauthorized call from the demo "user" role -> 403 envelope.
	response, lowerLogin := doJSON(t, client, http.MethodPost, server.URL+"/api/v1/auth/login", "",
		map[string]string{"username": "user", "password": "user"})
	if response.StatusCode != http.StatusOK {
		t.Fatalf("lower login: status=%d", response.StatusCode)
	}
	lowerToken := tokenFrom(t, lowerLogin.Data)
	response, body = doJSON(t, client, http.MethodGet, server.URL+"/api/v1/system/users", lowerToken, nil)
	if response.StatusCode != http.StatusForbidden || body.Code != 40301 {
		t.Fatalf("expected 403/40301, got status=%d code=%d (%s)", response.StatusCode, body.Code, body.Message)
	}
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

type smokeEnvelope struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
	TraceID string          `json:"traceId"`
}

func doJSON(t *testing.T, client *http.Client, method, url, token string, payload any) (*http.Response, smokeEnvelope) {
	t.Helper()
	var reader *bytes.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			t.Fatalf("marshal payload: %v", err)
		}
		reader = bytes.NewReader(encoded)
	} else {
		reader = bytes.NewReader(nil)
	}
	request, err := http.NewRequest(method, url, reader)
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	if payload != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}
	response, err := client.Do(request)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	defer response.Body.Close()
	var envelope smokeEnvelope
	if err := json.NewDecoder(response.Body).Decode(&envelope); err != nil {
		t.Fatalf("decode envelope: %v", err)
	}
	if envelope.TraceID == "" || response.Header.Get("X-Trace-Id") == "" {
		t.Fatal("missing trace id")
	}
	return response, envelope
}

func tokenFrom(t *testing.T, data json.RawMessage) string {
	t.Helper()
	var payload struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		t.Fatalf("decode token: %v", err)
	}
	return payload.Token
}

func findCookie(response *http.Response, name string) *http.Cookie {
	for _, cookie := range response.Cookies() {
		if cookie.Name == name {
			return cookie
		}
	}
	return nil
}
