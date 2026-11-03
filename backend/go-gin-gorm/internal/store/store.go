package store

import (
	"context"
	"errors"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Store owns all database access. Business rules stay in internal/domain and
// internal/service; this package only speaks GORM.
type Store struct {
	db *gorm.DB
}

func Open(dsn string) (*Store, error) {
	gormLogger := logger.New(log.New(os.Stdout, "", log.LstdFlags), logger.Config{
		SlowThreshold:             500 * time.Millisecond,
		LogLevel:                  logger.Warn,
		IgnoreRecordNotFoundError: true,
		Colorful:                  false,
	})
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: gormLogger})
	if err != nil {
		return nil, err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	if err := sqlDB.Ping(); err != nil {
		return nil, err
	}
	return &Store{db: db}, nil
}

func New(db *gorm.DB) *Store { return &Store{db: db} }

func (s *Store) DB() *gorm.DB { return s.db }

func (s *Store) Ping(ctx context.Context) error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.PingContext(ctx)
}

func notFound(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) }

func (s *Store) transaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return s.db.WithContext(ctx).Transaction(fn)
}

func escapeLike(value string) string {
	result := make([]byte, 0, len(value)+8)
	for i := 0; i < len(value); i++ {
		switch value[i] {
		case '\\', '%', '_':
			result = append(result, '\\', value[i])
		default:
			result = append(result, value[i])
		}
	}
	return string(result) + "%"
}

func likePrefix(value string) string { return escapeLike(value) }
