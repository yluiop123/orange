package store

import (
	"context"
	"strings"
	"time"
)

type OperationLogFilter struct {
	Username  string
	Path      string
	Status    int
	HasStatus bool
	From      *time.Time
	To        *time.Time
	Page      int
	Size      int
}

func (s *Store) InsertOperationLog(ctx context.Context, log *OperationLog) error {
	return s.db.WithContext(ctx).Create(log).Error
}

func (s *Store) ListOperationLogs(ctx context.Context, filter OperationLogFilter) (int64, []OperationLog, error) {
	query := s.db.WithContext(ctx).Model(&OperationLog{})
	if username := strings.TrimSpace(filter.Username); username != "" {
		query = query.Where("strpos(lower(username), lower(?)) > 0", username)
	}
	if path := strings.TrimSpace(filter.Path); path != "" {
		query = query.Where("strpos(lower(path), lower(?)) > 0", path)
	}
	if filter.HasStatus {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.From != nil {
		query = query.Where("create_time >= ?", *filter.From)
	}
	if filter.To != nil {
		query = query.Where("create_time <= ?", *filter.To)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return 0, nil, err
	}
	var logs []OperationLog
	err := query.Order("id DESC").
		Offset((filter.Page - 1) * filter.Size).
		Limit(filter.Size).
		Find(&logs).Error
	return total, logs, err
}

// CleanupOperationLogs removes rows older than the retention window.
func (s *Store) CleanupOperationLogs(ctx context.Context, before time.Time) (int64, error) {
	result := s.db.WithContext(ctx).Where("create_time < ?", before).Delete(&OperationLog{})
	return result.RowsAffected, result.Error
}
