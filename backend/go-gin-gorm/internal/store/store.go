package store

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Store owns all database access. Business rules stay in internal/domain and
// internal/service; this package only speaks GORM.
type Store struct {
	db *gorm.DB
}

// Open connects with the dialect selected by DB_DRIVER:
// postgres, mysql, mariadb (MySQL protocol) or sqlite (pure Go, no cgo).
func Open(driver, dsn string) (*Store, error) {
	gormLogger := logger.New(log.New(os.Stdout, "", log.LstdFlags), logger.Config{
		SlowThreshold:             500 * time.Millisecond,
		LogLevel:                  logger.Warn,
		IgnoreRecordNotFoundError: true,
		Colorful:                  false,
	})

	var dialector gorm.Dialector
	switch driver {
	case "postgres":
		dialector = postgres.Open(dsn)
	case "mysql", "mariadb":
		dialector = mysql.Open(dsn)
	case "sqlite":
		dialector = sqlite.Open(dsn)
	default:
		return nil, fmt.Errorf("unsupported database driver %q", driver)
	}

	db, err := gorm.Open(dialector, &gorm.Config{Logger: gormLogger})
	if err != nil {
		return nil, err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	if driver == "sqlite" {
		// One writer connection avoids SQLITE_BUSY between pooled connections;
		// SQLite serialises writers anyway.
		sqlDB.SetMaxOpenConns(1)
		sqlDB.SetMaxIdleConns(1)
	} else {
		sqlDB.SetMaxOpenConns(10)
		sqlDB.SetMaxIdleConns(5)
	}
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

// escapeLike escapes LIKE wildcards with '!'. Backslash is not portable: it is
// the default escape in PostgreSQL and MySQL, but SQLite treats it as a
// literal, so every query specifies ESCAPE '!' explicitly.
func escapeLike(value string) string {
	result := make([]byte, 0, len(value)+8)
	for i := 0; i < len(value); i++ {
		switch value[i] {
		case '!', '%', '_':
			result = append(result, '!', value[i])
		default:
			result = append(result, value[i])
		}
	}
	return string(result)
}

// likePrefix matches values that start with value.
func likePrefix(value string) string { return escapeLike(value) + "%" }

// likeContains matches values that contain value anywhere.
func likeContains(value string) string { return "%" + escapeLike(value) + "%" }
