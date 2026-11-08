package http

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/service"
)

// @Summary List operation logs
// @Description Returns a paginated list of audited HTTP operations.
// @Tags Operation Logs
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size (1-100)" default(10)
// @Param username query string false "Username filter"
// @Param path query string false "Request path prefix"
// @Param status query string false "HTTP status code (3 digits)"
// @Param from query string false "Start of the time range (RFC 3339)"
// @Param to query string false "End of the time range (RFC 3339)"
// @Success 200 {object} Envelope{data=OperationLogPageData}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Security BearerAuth
// @Router /system/operation-logs [get]
func (h *Handlers) listOperationLogs(c *gin.Context) {
	page, pageErr := intQuery(c, "page", 1)
	if pageErr != nil {
		fail(c, pageErr)
		return
	}
	size, sizeErr := intQuery(c, "size", 10)
	if sizeErr != nil {
		fail(c, sizeErr)
		return
	}
	if err := validatePage(page, size, 1<<30); err != nil {
		fail(c, err)
		return
	}

	query := service.OperationLogQuery{
		Username: c.Query("username"),
		Path:     c.Query("path"),
		Page:     page,
		Size:     size,
	}
	if status := c.Query("status"); status != "" {
		if !logStatusValue.MatchString(status) {
			fail(c, fieldError("status", "状态码必须是 3 位数字"))
			return
		}
		query.HasStatus = true
		for _, r := range status {
			query.Status = query.Status*10 + int(r-'0')
		}
	}
	if from := c.Query("from"); from != "" {
		parsed, err := time.Parse(time.RFC3339, from)
		if err != nil {
			fail(c, fieldError("from", "时间格式不正确，应为 ISO 8601"))
			return
		}
		query.From = &parsed
	}
	if to := c.Query("to"); to != "" {
		parsed, err := time.Parse(time.RFC3339, to)
		if err != nil {
			fail(c, fieldError("to", "时间格式不正确，应为 ISO 8601"))
			return
		}
		query.To = &parsed
	}

	result, err := h.svc.ListOperationLogs(c.Request.Context(), query)
	if err != nil {
		fail(c, err)
		return
	}
	success(c, result)
}
