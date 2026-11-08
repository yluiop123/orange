package store

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// errAttemptRetry signals that a concurrent request created the same attempt
// row first; the caller should re-read it instead of dropping the increment.
var errAttemptRetry = errors.New("login attempt row created concurrently")

func (s *Store) RevokeToken(ctx context.Context, jti, tokenType string, expiresAt time.Time) (bool, error) {
	now := time.Now()
	record := RevokedToken{JTI: jti, TokenType: tokenType, ExpiresAt: expiresAt, CreateTime: &now}
	result := s.db.WithContext(ctx).
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(&record)
	if result.Error != nil {
		return false, result.Error
	}
	// Opportunistically drop expired rows, like the reference implementation.
	_ = s.db.WithContext(ctx).Where("expires_at < ?", now).Delete(&RevokedToken{}).Error
	return result.RowsAffected > 0, nil
}

func (s *Store) IsTokenRevoked(ctx context.Context, jti string) (bool, error) {
	if jti == "" {
		return false, nil
	}
	var count int64
	err := s.db.WithContext(ctx).Model(&RevokedToken{}).Where("jti = ?", jti).Count(&count).Error
	return count > 0, err
}

func (s *Store) FindLoginAttempt(ctx context.Context, key string) (*LoginAttempt, error) {
	var attempt LoginAttempt
	if err := s.db.WithContext(ctx).Where("attempt_key = ?", key).First(&attempt).Error; err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	return &attempt, nil
}

// SaveLoginAttempt upserts one attempt key. A concurrent insert is resolved by
// the ON CONFLICT update branch. Kept for callers that record pre-computed
// state outside WithLockedAttempt.
func (s *Store) SaveLoginAttempt(ctx context.Context, attempt *LoginAttempt) error {
	return s.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "attempt_key"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"failures", "window_start", "locked_until", "update_time",
			}),
		}).
		Create(attempt).Error
}

func (s *Store) DeleteLoginAttempt(ctx context.Context, key string) error {
	return s.db.WithContext(ctx).Where("attempt_key = ?", key).Delete(&LoginAttempt{}).Error
}

// WithLockedAttempt runs fn against a locked row, creating it when missing.
func (s *Store) WithLockedAttempt(ctx context.Context, key string, fn func(attempt *LoginAttempt) error) error {
	for attemptNo := 0; attemptNo < 2; attemptNo++ {
		err := s.transaction(ctx, func(tx *gorm.DB) error {
			var attempt LoginAttempt
			err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("attempt_key = ?", key).First(&attempt).Error
			if err != nil && !notFound(err) {
				return err
			}
			if notFound(err) {
				attempt = LoginAttempt{AttemptKey: key, Failures: 0, WindowStart: time.Now(), UpdateTime: time.Now()}
				if err := fn(&attempt); err != nil {
					return err
				}
				result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&attempt)
				if result.Error != nil {
					return result.Error
				}
				if result.RowsAffected == 0 {
					return errAttemptRetry
				}
				return nil
			}
			if err := fn(&attempt); err != nil {
				return err
			}
			return tx.Save(&attempt).Error
		})
		if errors.Is(err, errAttemptRetry) {
			continue
		}
		return err
	}
	return errAttemptRetry
}
