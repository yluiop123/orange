package http

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// expectedOperations mirrors the 34 routes registered in router.go. It guards
// the generated document against handlers losing their swag annotations.
var expectedOperations = map[string][]string{
	"/auth/login":                           {http.MethodPost},
	"/auth/refresh":                         {http.MethodPost},
	"/auth/logout":                          {http.MethodPost},
	"/auth/user-info":                       {http.MethodGet},
	"/auth/menus":                           {http.MethodGet},
	"/auth/change-password":                 {http.MethodPost},
	"/system/groups":                        {http.MethodGet, http.MethodDelete},
	"/system/groups/{groupId}":              {http.MethodGet, http.MethodPatch, http.MethodDelete},
	"/system/groups/children":               {http.MethodPost},
	"/system/groups/{groupId}/status":       {http.MethodPatch},
	"/system/permissions":                   {http.MethodGet, http.MethodDelete},
	"/system/permissions/{permissionId}":    {http.MethodGet, http.MethodPatch, http.MethodDelete},
	"/system/permissions/children":          {http.MethodPost},
	"/system/roles":                         {http.MethodGet, http.MethodPost, http.MethodDelete},
	"/system/roles/{roleId}":                {http.MethodGet, http.MethodPatch, http.MethodDelete},
	"/system/users":                         {http.MethodGet, http.MethodPost, http.MethodDelete},
	"/system/users/{userId}":                {http.MethodGet, http.MethodPatch, http.MethodDelete},
	"/system/users/{userId}/status":         {http.MethodPatch},
	"/system/users/{userId}/reset-password": {http.MethodPost},
	"/system/operation-logs":                {http.MethodGet},
}

type swaggerDocument struct {
	Swagger  string                               `json:"swagger"`
	Info     map[string]any                       `json:"info"`
	BasePath string                               `json:"basePath"`
	Paths    map[string]map[string]map[string]any `json:"paths"`
	Security map[string]map[string]any            `json:"securityDefinitions"`
	Defs     map[string]map[string]any            `json:"definitions"`
}

func TestSwaggerServesGeneratedDocument(t *testing.T) {
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

	var document swaggerDocument
	if err := json.Unmarshal(recorder.Body.Bytes(), &document); err != nil {
		t.Fatalf("GET /openapi.json is not valid JSON: %v", err)
	}
	if document.Swagger != "2.0" {
		t.Fatalf("swagger version = %q, want 2.0", document.Swagger)
	}
	if document.BasePath != "/api/v1" {
		t.Fatalf("basePath = %q, want /api/v1", document.BasePath)
	}
	if title, _ := document.Info["title"].(string); title == "" {
		t.Fatal("generated document has no info.title")
	}

	operationCount := 0
	for path, methods := range expectedOperations {
		registered, ok := document.Paths[path]
		if !ok {
			t.Errorf("generated document is missing path %s", path)
			continue
		}
		for _, method := range methods {
			operationCount++
			operation, ok := registered[strings.ToLower(method)]
			if !ok {
				t.Errorf("generated document is missing %s %s", method, path)
				continue
			}
			if summary, _ := operation["summary"].(string); summary == "" {
				t.Errorf("%s %s has no summary", method, path)
			}
			if tags, ok := operation["tags"].([]any); !ok || len(tags) == 0 {
				t.Errorf("%s %s has no tags", method, path)
			}
			if responses, ok := operation["responses"].(map[string]any); !ok || responses["200"] == nil {
				t.Errorf("%s %s has no 200 response", method, path)
			}
		}
	}
	if operationCount != 34 {
		t.Fatalf("expected operations = %d, want 34", operationCount)
	}

	bearer := document.Security["BearerAuth"]
	if bearer == nil || bearer["type"] != "apiKey" || bearer["in"] != "header" || bearer["name"] != "Authorization" {
		t.Fatalf("BearerAuth security definition = %+v, want apiKey in header named Authorization", bearer)
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
		"./swagger-ui-bundle.js",
		"./swagger-initializer.js",
	} {
		if !strings.Contains(page, needle) {
			t.Errorf("GET /swagger is missing %q", needle)
		}
	}

	// The initializer must point the UI at the generated document.
	recorder = httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/swagger/swagger-initializer.js", nil))
	if recorder.Code != http.StatusOK {
		t.Fatalf("GET /swagger/swagger-initializer.js status = %d, want 200", recorder.Code)
	}
	if initializer := recorder.Body.String(); !strings.Contains(initializer, `url: "/openapi.json"`) {
		t.Fatalf("swagger initializer does not load /openapi.json: %s", initializer)
	}
}
