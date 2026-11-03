package store

import (
	"context"
	"fmt"
	"reflect"
	"strings"
	"time"

	"gorm.io/gorm/schema"
)

// timeSerializerName is attached to every timestamp model field. The SQLite
// schema stores timestamps as TEXT (see database/sqlite/ddl.sql), and the pure
// Go SQLite driver returns TEXT columns as string, which database/sql cannot
// scan into time.Time. The serializer accepts time.Time, string, []byte and
// NULL and parses the known formats, so the same models work on PostgreSQL,
// MySQL, MariaDB and SQLite.
const timeSerializerName = "orangetime"

func init() {
	schema.RegisterSerializer(timeSerializerName, timeSerializer{})
}

type timeSerializer struct{}

// storeTimeLayouts covers SQLite's TEXT defaults, the glebarez/go-sqlite
// write format, RFC 3339 and PostgreSQL ISO output.
var storeTimeLayouts = []string{
	"2006-01-02 15:04:05.999999999-07:00",
	"2006-01-02T15:04:05.999999999-07:00",
	time.RFC3339Nano,
	"2006-01-02 15:04:05.999999999 -0700 MST",
	"2006-01-02 15:04:05.999999999",
	"2006-01-02T15:04:05.999999999",
	"2006-01-02 15:04:05",
	"2006-01-02T15:04:05",
	"2006-01-02",
}

func (timeSerializer) Scan(ctx context.Context, field *schema.Field, dst reflect.Value, dbValue interface{}) error {
	fieldValue := field.ReflectValueOf(ctx, dst)
	if dbValue == nil {
		if fieldValue.Kind() == reflect.Ptr {
			fieldValue.Set(reflect.Zero(fieldValue.Type()))
		}
		return nil
	}
	parsed, err := parseStoreTime(dbValue)
	if err != nil {
		return fmt.Errorf("column %s: %w", field.DBName, err)
	}
	if fieldValue.Kind() == reflect.Ptr {
		if fieldValue.IsNil() {
			fieldValue.Set(reflect.New(fieldValue.Type().Elem()))
		}
		fieldValue.Elem().Set(reflect.ValueOf(parsed))
		return nil
	}
	fieldValue.Set(reflect.ValueOf(parsed))
	return nil
}

func (timeSerializer) Value(ctx context.Context, field *schema.Field, dst reflect.Value, fieldValue interface{}) (interface{}, error) {
	switch value := fieldValue.(type) {
	case *time.Time:
		if value == nil {
			return nil, nil
		}
		return *value, nil
	case time.Time:
		return value, nil
	case nil:
		return nil, nil
	default:
		return fieldValue, nil
	}
}

func parseStoreTime(value interface{}) (time.Time, error) {
	switch raw := value.(type) {
	case time.Time:
		return raw, nil
	case *time.Time:
		if raw == nil {
			return time.Time{}, nil
		}
		return *raw, nil
	case string:
		return parseStoreTimeString(raw)
	case []byte:
		return parseStoreTimeString(string(raw))
	default:
		return time.Time{}, fmt.Errorf("unsupported timestamp value %T", value)
	}
}

func parseStoreTimeString(raw string) (time.Time, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return time.Time{}, nil
	}
	for _, layout := range storeTimeLayouts {
		if parsed, err := time.ParseInLocation(layout, value, time.UTC); err == nil {
			return parsed, nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse timestamp %q", raw)
}
