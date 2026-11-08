package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// repositoryContract is contracts/openapi.json four levels above this package
// (internal/http -> internal -> go-gin-gorm -> backend -> repository root).
var repositoryContract = filepath.Join("..", "..", "..", "..", "contracts", "openapi.json")

func TestSwaggerServesTheRepositoryContract(t *testing.T) {
	want, err := os.ReadFile(repositoryContract)
	if err != nil {
		t.Fatalf("read repository contract: %v", err)
	}

	router := testRouter()
	recorder := httptest.NewRecorder()
	// No Authorization header: the endpoint must stay anonymous.
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/openapi.json", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("GET /openapi.json status = %d, want 200", recorder.Code)
	}
	if got := recorder.Header().Get("Content-Type"); got != "application/json" {
		t.Fatalf("GET /openapi.json content type = %q, want application/json", got)
	}
	if !bytes.Equal(recorder.Body.Bytes(), want) {
		t.Fatal("GET /openapi.json did not return contracts/openapi.json")
	}
	var document map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &document); err != nil {
		t.Fatalf("served contract is not valid JSON: %v", err)
	}
}

func TestSwaggerUIPageIsAnonymous(t *testing.T) {
	router := testRouter()
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/swagger", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("GET /swagger status = %d, want 200", recorder.Code)
	}
	if got := recorder.Header().Get("Content-Type"); got != "text/html; charset=utf-8" {
		t.Fatalf("GET /swagger content type = %q, want text/html; charset=utf-8", got)
	}
	page := recorder.Body.String()
	for _, needle := range []string{
		"<title>Orange API</title>",
		"https://unpkg.com/swagger-ui-dist@5/swagger-ui.css",
		"https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js",
		"SwaggerUIBundle({url:'/openapi.json', dom_id:'#swagger-ui', persistAuthorization:true, docExpansion:'none'});",
	} {
		if !strings.Contains(page, needle) {
			t.Errorf("GET /swagger is missing %q", needle)
		}
	}
}
