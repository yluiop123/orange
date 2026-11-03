package http

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
)

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
		business = domain.SystemError()
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
