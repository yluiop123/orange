package http

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/config"
)

func testRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return NewRouter(nil, nil, config.Config{
		CORSOrigins: []string{"http://localhost:5173"},
		JWT: config.JWT{
			RefreshTTL: time.Hour,
		},
		Cookie: config.Cookie{Path: "/api/v1/auth", SameSite: "Lax"},
	})
}

func TestUnauthenticatedRequestUsesEnvelope(t *testing.T) {
	router := testRouter()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/system/users", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
	if recorder.Header().Get("X-Trace-Id") == "" {
		t.Fatal("missing X-Trace-Id response header")
	}
	var body Envelope
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode envelope: %v", err)
	}
	if body.Code != 40101 {
		t.Fatalf("code = %d, want 40101", body.Code)
	}
	if body.TraceID != recorder.Header().Get("X-Trace-Id") {
		t.Fatalf("body traceId %q != header %q", body.TraceID, recorder.Header().Get("X-Trace-Id"))
	}
	// Data is null for errors but the field must exist.
	var raw map[string]json.RawMessage
	_ = json.Unmarshal(recorder.Body.Bytes(), &raw)
	for _, key := range []string{"code", "message", "data", "timestamp", "traceId"} {
		if _, ok := raw[key]; !ok {
			t.Fatalf("envelope missing %q", key)
		}
	}
}

func TestIncomingTraceIDIsPreserved(t *testing.T) {
	router := testRouter()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/system/users", nil)
	request.Header.Set("X-Trace-Id", "client-trace-123456")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if got := recorder.Header().Get("X-Trace-Id"); got != "client-trace-123456" {
		t.Fatalf("trace header = %q", got)
	}
}

func TestNotFoundEnvelope(t *testing.T) {
	router := testRouter()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/nope", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", recorder.Code)
	}
	var body Envelope
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode envelope: %v", err)
	}
	if body.Code != 40401 {
		t.Fatalf("code = %d, want 40401", body.Code)
	}
}

func TestCORSPreflightAllowsCredentials(t *testing.T) {
	router := testRouter()
	request := httptest.NewRequest(http.MethodOptions, "/api/v1/auth/login", nil)
	request.Header.Set("Origin", "http://localhost:5173")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", recorder.Code)
	}
	if got := recorder.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("allow origin = %q", got)
	}
	if got := recorder.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("allow credentials = %q", got)
	}
}

func TestHealthCheck(t *testing.T) {
	router := testRouter()
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
}
