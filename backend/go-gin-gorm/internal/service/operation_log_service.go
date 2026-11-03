package service

import (
	"context"
	"time"

	"github.com/orange/backend-go-gin-gorm/internal/store"
)

type OperationLogBean struct {
	ID          int64   `json:"id"`
	TraceID     *string `json:"traceId"`
	Username    *string `json:"username"`
	Method      string  `json:"method"`
	Path        string  `json:"path"`
	QueryString *string `json:"queryString"`
	RequestBody *string `json:"requestBody"`
	Status      int     `json:"status"`
	DurationMs  int64   `json:"durationMs"`
	IP          *string `json:"ip"`
	CreateTime  string  `json:"createTime"`
}

type OperationLogEntry struct {
	TraceID     string
	Username    string
	Method      string
	Path        string
	QueryString *string
	RequestBody *string
	Status      int
	DurationMs  int64
	IP          string
	CreateTime  time.Time
}

func (s *Service) RecordOperation(ctx context.Context, entry OperationLogEntry) error {
	traceID := entry.TraceID
	username := entry.Username
	ip := entry.IP
	log := store.OperationLog{
		TraceID:     &traceID,
		Username:    &username,
		Method:      entry.Method,
		Path:        entry.Path,
		QueryString: entry.QueryString,
		RequestBody: entry.RequestBody,
		Status:      entry.Status,
		DurationMs:  entry.DurationMs,
		IP:          &ip,
		CreateTime:  entry.CreateTime,
	}
	return s.store.InsertOperationLog(ctx, &log)
}

type OperationLogQuery struct {
	Username  string
	Path      string
	Status    int
	HasStatus bool
	From      *time.Time
	To        *time.Time
	Page      int
	Size      int
}

func (s *Service) ListOperationLogs(ctx context.Context, query OperationLogQuery) (*PageData[OperationLogBean], error) {
	total, logs, err := s.store.ListOperationLogs(ctx, store.OperationLogFilter{
		Username:  query.Username,
		Path:      query.Path,
		Status:    query.Status,
		HasStatus: query.HasStatus,
		From:      query.From,
		To:        query.To,
		Page:      query.Page,
		Size:      query.Size,
	})
	if err != nil {
		return nil, err
	}
	beans := make([]OperationLogBean, 0, len(logs))
	for _, item := range logs {
		beans = append(beans, OperationLogBean{
			ID:          item.ID,
			TraceID:     item.TraceID,
			Username:    item.Username,
			Method:      item.Method,
			Path:        item.Path,
			QueryString: item.QueryString,
			RequestBody: item.RequestBody,
			Status:      item.Status,
			DurationMs:  item.DurationMs,
			IP:          item.IP,
			CreateTime:  isoTime(item.CreateTime),
		})
	}
	page := newPageData(total, beans, query.Page, query.Size)
	return &page, nil
}
