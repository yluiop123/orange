package http

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
)

// isIntegrityError recognises the unique / foreign-key / not-null failures the
// four supported drivers can raise. They all mean "conflict" (40901), never an
// internal error.
func isIntegrityError(err error) bool {
	if err == nil {
		return false
	}
	message := err.Error()
	for _, marker := range []string{
		"duplicate key value violates unique constraint",
		"UNIQUE constraint failed",
		"Duplicate entry",
		"violates foreign key constraint",
		"FOREIGN KEY constraint failed",
		"Cannot add or update a child row",
		"Cannot delete or update a parent row",
		"a foreign key constraint fails",
		"null value in column",
		"NOT NULL constraint failed",
		"cannot be null",
	} {
		if strings.Contains(message, marker) {
			return true
		}
	}
	return false
}

type Envelope struct {
	Code      int    `json:"code"`
	Message   string `json:"message"`
	Data      any    `json:"data"`
	Timestamp int64  `json:"timestamp"`
	TraceID   string `json:"traceId"`
}

func success(c *gin.Context, data any) {
	message := ""
	if text, ok := data.(string); ok {
		message = text
	}
	writeEnvelope(c, http.StatusOK, Envelope{
		Code:      domain.CodeSuccess,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
		TraceID:   traceIDOf(c),
	})
}

func successMessage(c *gin.Context, message string, data any) {
	writeEnvelope(c, http.StatusOK, Envelope{
		Code:      domain.CodeSuccess,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
		TraceID:   traceIDOf(c),
	})
}

func fail(c *gin.Context, err error) {
	business, ok := err.(*domain.Error)
	if !ok {
		if isIntegrityError(err) {
			business = domain.Conflict("数据冲突，请刷新后重试")
		} else {
			business = domain.SystemError()
		}
	}
	writeEnvelope(c, business.HTTPStatus, Envelope{
		Code:      business.Code,
		Message:   business.Message,
		Data:      business.Data,
		Timestamp: time.Now().UnixMilli(),
		TraceID:   traceIDOf(c),
	})
}

func writeEnvelope(c *gin.Context, status int, body Envelope) {
	c.Header("X-Trace-Id", body.TraceID)
	c.JSON(status, body)
}
