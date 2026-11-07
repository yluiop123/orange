package http

// Unified Swagger entry point.
//
// Both routes are mounted on the root router, outside the /api/v1 group and
// outside requireAuth, so they are anonymous. The schema is the repository-wide
// contracts/openapi.json: go:embed cannot reach it (it lives above the module
// root), so it is read from disk once while the router is built and cached for
// the lifetime of the process.

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
)

const (
	contractRelativePath = "contracts/openapi.json"
	// maxAncestorLevels is how many parents above the working directory are
	// checked. CI starts each stack from its own directory
	// (backend/go-gin-gorm), where ../../contracts/openapi.json is two levels up.
	maxAncestorLevels = 5
)

const swaggerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orange API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({url:'/openapi.json', dom_id:'#swagger-ui', persistAuthorization:true, docExpansion:'none'});
  </script>
</body>
</html>
`

var (
	openAPIContractOnce sync.Once
	openAPIContractJSON []byte
	openAPIContractErr  error
)

// registerSwaggerRoutes mounts the anonymous documentation endpoints. It runs
// while the router is constructed, so the contract read happens at startup.
func registerSwaggerRoutes(router *gin.Engine) {
	contract, err := loadOpenAPIContract()
	if err != nil {
		log.Printf("swagger: %v; GET /openapi.json will return 500", err)
	}

	router.GET("/openapi.json", func(c *gin.Context) {
		if err != nil {
			// A missing contract is a deployment error, not a client error.
			log.Printf("GET /openapi.json: %v", err)
			fail(c, domain.SystemError())
			return
		}
		c.Data(http.StatusOK, "application/json", contract)
	})

	router.GET("/swagger", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(swaggerHTML))
	})
}

// loadOpenAPIContract reads the contract once and caches the bytes.
func loadOpenAPIContract() ([]byte, error) {
	openAPIContractOnce.Do(func() {
		path, err := findOpenAPIContract()
		if err != nil {
			openAPIContractErr = err
			return
		}
		openAPIContractJSON, openAPIContractErr = os.ReadFile(path)
		if openAPIContractErr != nil {
			openAPIContractErr = fmt.Errorf("read %s: %w", path, openAPIContractErr)
		}
	})
	return openAPIContractJSON, openAPIContractErr
}

// findOpenAPIContract walks up from the process working directory, checking the
// directory itself plus at most five parents.
func findOpenAPIContract() (string, error) {
	directory, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("resolve working directory: %w", err)
	}
	for level := 0; level <= maxAncestorLevels; level++ {
		candidate := filepath.Join(directory, contractRelativePath)
		if info, statErr := os.Stat(candidate); statErr == nil && info.Mode().IsRegular() {
			return candidate, nil
		}
		parent := filepath.Dir(directory)
		if parent == directory {
			break
		}
		directory = parent
	}
	return "", fmt.Errorf("contracts/openapi.json was not found within %d levels above the working directory", maxAncestorLevels)
}
