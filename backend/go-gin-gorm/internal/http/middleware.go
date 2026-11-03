package http

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/service"
)

var safeTraceID = regexp.MustCompile(`^[A-Za-z0-9._-]{8,64}$`)

func newTraceID() string {
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		return "0000000000000000"
	}
	return hex.EncodeToString(buf)
}

// TraceID accepts a sane inbound X-Trace-Id (falling back to X-Request-Id),
// otherwise generates one, and mirrors it into the response header.
func TraceID() gin.HandlerFunc {
	return func(c *gin.Context) {
		incoming := c.GetHeader("X-Trace-Id")
		if incoming == "" {
			incoming = c.GetHeader("X-Request-Id")
		}
		traceID := newTraceID()
		if safeTraceID.MatchString(incoming) {
			traceID = incoming
		}
		c.Set(ctxTraceID, traceID)
		c.Header("X-Trace-Id", traceID)
		c.Next()
	}
}

func CORS(origins []string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(origins))
	for _, origin := range origins {
		allowed[origin] = true
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && allowed[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, Locale, X-Trace-Id, X-Request-Id")
			c.Header("Access-Control-Expose-Headers", "X-Trace-Id")
			c.Header("Access-Control-Max-Age", "3600")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("panic: %v", recovered)
				if c.Writer.Written() {
					c.Abort()
					return
				}
				fail(c, domain.SystemError())
				c.Abort()
			}
		}()
		c.Next()
	}
}

// operationLog records non-GET writes to /api/v1/system/* and
// /auth/change-password. Bodies are sanitized and truncated; sensitive paths
// never store a body.
func (h *Handlers) operationLog() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		method := c.Request.Method
		if !domain.ShouldRecord(method, path) {
			c.Next()
			return
		}

		start := time.Now()
		var body string
		if c.Request.Body != nil && strings.Contains(strings.ToLower(c.GetHeader("Content-Type")), "json") {
			content, err := io.ReadAll(c.Request.Body)
			if err == nil {
				body = string(content)
			}
			c.Request.Body = io.NopCloser(bytes.NewReader(content))
		}

		c.Next()

		username := "anonymous"
		if actor := actorOf(c); actor != nil {
			username = actor.Username
		}
		entry := service.OperationLogEntry{
			TraceID:     traceIDOf(c),
			Username:    username,
			Method:      method,
			Path:        path,
			QueryString: domain.TruncateQuery(c.Request.URL.RawQuery),
			RequestBody: domain.BodyForLog(path, body),
			Status:      c.Writer.Status(),
			DurationMs:  time.Since(start).Milliseconds(),
			IP:          domain.ClientIP(c.GetHeader("X-Forwarded-For"), c.ClientIP()),
			CreateTime:  time.Now(),
		}
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := h.svc.RecordOperation(ctx, entry); err != nil {
			log.Printf("failed to write operation log: %v", err)
		}
	}
}

func abortWithError(c *gin.Context, status int, message string) {
	var business *domain.Error
	switch status {
	case http.StatusUnauthorized:
		business = domain.Unauthorized(message)
	case http.StatusForbidden:
		business = domain.Forbidden(message)
	case http.StatusNotFound:
		business = domain.NotFound(message)
	default:
		business = domain.Validation(message)
	}
	fail(c, business)
	c.Abort()
}

func forbiddenPasswordChange() *domain.Error { return domain.PasswordChangeRequired() }
