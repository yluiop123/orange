package config

import (
	"os"
	"strings"
	"testing"
)

// clearDatabaseEnv removes every database variable so the test sees the
// driver defaults, then restores the previous values.
func clearDatabaseEnv(t *testing.T) {
	t.Helper()
	for _, key := range []string{
		"DB_DRIVER", "DATABASE_URL", "DB_HOST", "DB_PORT", "DB_NAME",
		"DB_USER", "DB_PASSWORD", "DB_SSLMODE", "DB_TIMEZONE", "DB_PATH",
		"SQLITE_PATH",
	} {
		key := key
		value, ok := os.LookupEnv(key)
		if err := os.Unsetenv(key); err != nil {
			t.Fatalf("unset %s: %v", key, err)
		}
		t.Cleanup(func() {
			if ok {
				_ = os.Setenv(key, value)
			} else {
				_ = os.Unsetenv(key)
			}
		})
	}
}

func TestLoadKeepsPostgresDefault(t *testing.T) {
	clearDatabaseEnv(t)
	database := Load().Database
	if database.Driver != DriverPostgres {
		t.Fatalf("driver = %q, want postgres", database.Driver)
	}
	dsn, err := database.DSN()
	if err != nil {
		t.Fatalf("dsn: %v", err)
	}
	for _, want := range []string{"host=localhost", "port=5432", "dbname=orange", "user=postgres"} {
		if !strings.Contains(dsn, want) {
			t.Fatalf("dsn %q missing %q", dsn, want)
		}
	}
}

func TestDiscreteVariablesUseDriverDefaults(t *testing.T) {
	clearDatabaseEnv(t)
	t.Setenv("DB_DRIVER", "mysql")
	database := Load().Database
	if database.Driver != DriverMySQL {
		t.Fatalf("driver = %q, want mysql", database.Driver)
	}
	if database.Port != "3306" || database.User != "root" {
		t.Fatalf("mysql defaults = port %q user %q", database.Port, database.User)
	}
	dsn, err := database.DSN()
	if err != nil {
		t.Fatalf("dsn: %v", err)
	}
	if !strings.Contains(dsn, "tcp(localhost:3306)/orange") || !strings.Contains(dsn, "parseTime=true") {
		t.Fatalf("unexpected mysql dsn %q", dsn)
	}
}

func TestDatabaseURLWinsOverDiscreteVariables(t *testing.T) {
	clearDatabaseEnv(t)
	t.Setenv("DB_DRIVER", "mariadb")
	t.Setenv("DB_HOST", "ignored")
	t.Setenv("DB_PORT", "9999")
	t.Setenv("DATABASE_URL", "mariadb://root:secret@db.internal:53307/orange_go?charset=utf8mb4&timeout=5s")
	database := Load().Database
	dsn, err := database.DSN()
	if err != nil {
		t.Fatalf("dsn: %v", err)
	}
	if !strings.Contains(dsn, "root:secret@tcp(db.internal:53307)/orange_go") {
		t.Fatalf("unexpected mariadb dsn %q", dsn)
	}
	if !strings.Contains(dsn, "parseTime=true") || !strings.Contains(dsn, "charset=utf8mb4") || !strings.Contains(dsn, "timeout=5s") {
		t.Fatalf("dsn must force parseTime and keep driver options: %q", dsn)
	}
}

func TestDatabaseURLInfersDriver(t *testing.T) {
	clearDatabaseEnv(t)
	t.Setenv("DATABASE_URL", "postgres://postgres:postgres@localhost:55432/orange_go?sslmode=disable")
	database := Load().Database
	if database.Driver != DriverPostgres {
		t.Fatalf("driver = %q, want postgres", database.Driver)
	}
	dsn, err := database.DSN()
	if err != nil {
		t.Fatalf("dsn: %v", err)
	}
	if dsn != "postgres://postgres:postgres@localhost:55432/orange_go?sslmode=disable" {
		t.Fatalf("postgres URL must pass through unchanged, got %q", dsn)
	}
}

func TestSQLitePathAndPragmas(t *testing.T) {
	clearDatabaseEnv(t)
	t.Setenv("DB_DRIVER", "sqlite")
	t.Setenv("DB_PATH", "orange-go.db")
	database := Load().Database
	if database.Driver != DriverSQLite {
		t.Fatalf("driver = %q, want sqlite", database.Driver)
	}
	dsn, err := database.DSN()
	if err != nil {
		t.Fatalf("dsn: %v", err)
	}
	if !strings.HasPrefix(dsn, "orange-go.db?") {
		t.Fatalf("unexpected sqlite dsn %q", dsn)
	}
	if !strings.Contains(dsn, "_pragma=foreign_keys(1)") || !strings.Contains(dsn, "_pragma=busy_timeout(5000)") {
		t.Fatalf("sqlite dsn must enable pragmas: %q", dsn)
	}
}

func TestSQLiteURLPrefixIsAccepted(t *testing.T) {
	clearDatabaseEnv(t)
	t.Setenv("DB_DRIVER", "sqlite")
	t.Setenv("DATABASE_URL", "sqlite:file.db")
	dsn, err := Load().Database.DSN()
	if err != nil {
		t.Fatalf("dsn: %v", err)
	}
	if !strings.HasPrefix(dsn, "file.db?") {
		t.Fatalf("unexpected sqlite dsn %q", dsn)
	}
}

func TestUnsupportedDriverIsRejected(t *testing.T) {
	clearDatabaseEnv(t)
	t.Setenv("DB_DRIVER", "oracle")
	if _, err := Load().Database.DSN(); err == nil {
		t.Fatal("expected an error for an unsupported driver")
	}
}
