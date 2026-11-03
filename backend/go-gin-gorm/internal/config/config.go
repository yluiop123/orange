package config

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
)

// Supported database drivers. MariaDB speaks the MySQL protocol, so it uses
// the MySQL driver but keeps its own name for the logs.
const (
	DriverPostgres = "postgres"
	DriverMySQL    = "mysql"
	DriverMariaDB  = "mariadb"
	DriverSQLite   = "sqlite"

	defaultSQLitePath = "orange-go.db"
)

type Database struct {
	// Driver is one of postgres, mysql, mariadb or sqlite.
	Driver string
	// URL is DATABASE_URL when set. It wins over the discrete DB_* fields.
	URL      string
	Host     string
	Port     string
	Name     string
	User     string
	Password string
	SSLMode  string
	TimeZone string
	// Path is the SQLite file. DATABASE_URL wins when both are set.
	Path string
}

type JWT struct {
	Secret         string
	PrivateKeyPath string
	PublicKeyPath  string
	PrivateKeyPEM  string
	PublicKeyPEM   string
	AccessTTL      time.Duration
	RefreshTTL     time.Duration
	Issuer         string
}

type Cookie struct {
	Secure   bool
	SameSite string
	Domain   string
	Path     string
}

type Lockout struct {
	MaxAttempts   int
	IPMaxAttempts int
	LockFor       time.Duration
}

type Config struct {
	Port                      string
	Database                  Database
	JWT                       JWT
	CORSOrigins               []string
	Cookie                    Cookie
	Lockout                   Lockout
	OperationLogRetentionDays int
}

// DSN renders the driver-specific data source name.
//
// Precedence:
//  1. DATABASE_URL (normalised per driver; a mysql:// or mariadb:// URL is
//     rewritten to the go-sql-driver form),
//  2. the discrete DB_* variables (and DB_PATH for SQLite),
//  3. driver defaults (PostgreSQL keeps the historical localhost:5432/orange
//     postgres/postgres defaults).
func (d Database) DSN() (string, error) {
	switch d.Driver {
	case DriverSQLite:
		return sqliteDSN(d.sqlitePath()), nil
	case DriverMySQL, DriverMariaDB:
		return mysqlDSN(d)
	case DriverPostgres:
		if d.URL != "" {
			return d.URL, nil
		}
		return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
			d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode, d.TimeZone), nil
	default:
		return "", fmt.Errorf("unsupported DB_DRIVER %q (want postgres, mysql, mariadb or sqlite)", d.Driver)
	}
}

func (d Database) sqlitePath() string {
	if d.URL != "" {
		return d.URL
	}
	if strings.TrimSpace(d.Path) != "" {
		return d.Path
	}
	return defaultSQLitePath
}

// sqliteDSN adds the per-connection pragmas the schema needs. SQLite has
// foreign keys disabled by default and only enables them per connection, so
// every pooled connection must run the pragma.
func sqliteDSN(raw string) string {
	path := strings.TrimSpace(raw)
	lower := strings.ToLower(path)
	switch {
	case strings.HasPrefix(lower, "sqlite://"):
		path = path[len("sqlite://"):]
	case strings.HasPrefix(lower, "sqlite:"):
		path = path[len("sqlite:"):]
	}
	if strings.TrimSpace(path) == "" {
		path = defaultSQLitePath
	}
	separator := "?"
	if strings.Contains(path, "?") {
		separator = "&"
	}
	return path + separator + "_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)"
}

// mysqlDSN normalises every accepted form to go-sql-driver syntax and forces
// parseTime so DATETIME/TIMESTAMP columns arrive as time.Time.
func mysqlDSN(d Database) (string, error) {
	raw := strings.TrimSpace(d.URL)
	if raw == "" {
		cfg := mysql.NewConfig()
		cfg.User = d.User
		cfg.Passwd = d.Password
		cfg.Net = "tcp"
		cfg.Addr = net.JoinHostPort(d.Host, d.Port)
		cfg.DBName = d.Name
		applyMySQLDefaults(cfg)
		return cfg.FormatDSN(), nil
	}
	if !strings.Contains(raw, "://") {
		cfg, err := mysql.ParseDSN(raw)
		if err != nil {
			return "", fmt.Errorf("parse DATABASE_URL: %w", err)
		}
		applyMySQLDefaults(cfg)
		return cfg.FormatDSN(), nil
	}

	parsed, err := url.Parse(raw)
	if err != nil {
		return "", fmt.Errorf("parse DATABASE_URL: %w", err)
	}
	host := parsed.Hostname()
	if host == "" {
		host = "localhost"
	}
	port := parsed.Port()
	if port == "" {
		port = "3306"
	}
	// Parse the URL query with go-sql-driver itself so driver options such as
	// tls, timeout and charset are interpreted correctly instead of being sent
	// as session variables.
	source := fmt.Sprintf("tcp(%s)/%s", net.JoinHostPort(host, port), strings.TrimPrefix(parsed.Path, "/"))
	if parsed.RawQuery != "" {
		source += "?" + parsed.RawQuery
	}
	cfg, err := mysql.ParseDSN(source)
	if err != nil {
		return "", fmt.Errorf("parse DATABASE_URL: %w", err)
	}
	if parsed.User != nil {
		cfg.User = parsed.User.Username()
		if password, ok := parsed.User.Password(); ok {
			cfg.Passwd = password
		}
	}
	applyMySQLDefaults(cfg)
	return cfg.FormatDSN(), nil
}

func applyMySQLDefaults(cfg *mysql.Config) {
	cfg.ParseTime = true
	if cfg.Loc == nil {
		cfg.Loc = time.UTC
	}
}

// Load reads the environment. DATABASE_URL+DB_DRIVER describe the connection
// in one switch; without them the historical DB_* PostgreSQL defaults apply.
func Load() Config {
	accessSeconds := envInt("JWT_ACCESS_EXPIRE", envInt("ACCESS_TOKEN_EXPIRE_SECONDS", 900))
	refreshSeconds := envInt("JWT_REFRESH_EXPIRE", envInt("REFRESH_TOKEN_EXPIRE_SECONDS", 604800))
	databaseURL := strings.TrimSpace(env("DATABASE_URL", ""))
	driver := normalizeDriver(env("DB_DRIVER", ""))
	if driver == "" {
		if databaseURL != "" {
			driver = inferDriver(databaseURL)
		} else {
			driver = DriverPostgres
		}
	}
	return Config{
		Port: env("APP_PORT", env("PORT", "8081")),
		Database: Database{
			Driver:   driver,
			URL:      databaseURL,
			Host:     env("DB_HOST", defaultHost(driver)),
			Port:     env("DB_PORT", defaultPort(driver)),
			Name:     env("DB_NAME", defaultName(driver)),
			User:     env("DB_USER", defaultUser(driver)),
			Password: env("DB_PASSWORD", defaultPassword(driver)),
			SSLMode:  env("DB_SSLMODE", "disable"),
			TimeZone: env("DB_TIMEZONE", "UTC"),
			Path:     env("DB_PATH", env("SQLITE_PATH", defaultSQLitePath)),
		},
		JWT: JWT{
			Secret:         env("JWT_SECRET", "orange-dev-secret-change-me-in-production"),
			PrivateKeyPath: env("JWT_PRIVATE_KEY_PATH", ""),
			PublicKeyPath:  env("JWT_PUBLIC_KEY_PATH", ""),
			PrivateKeyPEM:  env("JWT_PRIVATE_KEY", ""),
			PublicKeyPEM:   env("JWT_PUBLIC_KEY", ""),
			AccessTTL:      time.Duration(accessSeconds) * time.Second,
			RefreshTTL:     time.Duration(refreshSeconds) * time.Second,
			Issuer:         env("JWT_ISSUER", "orange"),
		},
		CORSOrigins: splitList(env("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:4200")),
		Cookie: Cookie{
			Secure:   envBool("COOKIE_SECURE", false),
			SameSite: env("COOKIE_SAME_SITE", "Lax"),
			Domain:   env("COOKIE_DOMAIN", ""),
			Path:     env("COOKIE_PATH", "/api/v1/auth"),
		},
		Lockout: Lockout{
			MaxAttempts:   envInt("LOGIN_MAX_ATTEMPTS", 5),
			IPMaxAttempts: envInt("LOGIN_IP_MAX_ATTEMPTS", 20),
			LockFor:       time.Duration(envInt("LOGIN_LOCK_MINUTES", 15)) * time.Minute,
		},
		OperationLogRetentionDays: envInt("LOG_RETENTION_DAYS", envInt("OPERATION_LOG_RETENTION_DAYS", 90)),
	}
}

func normalizeDriver(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "":
		return ""
	case "postgres", "postgresql", "pg":
		return DriverPostgres
	case "mysql":
		return DriverMySQL
	case "mariadb", "maria":
		return DriverMariaDB
	case "sqlite", "sqlite3":
		return DriverSQLite
	default:
		return strings.ToLower(strings.TrimSpace(value))
	}
}

// inferDriver guesses DB_DRIVER from DATABASE_URL. A bare value with no URL
// scheme is treated as a SQLite file.
func inferDriver(raw string) string {
	lower := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case strings.HasPrefix(lower, "postgres://"), strings.HasPrefix(lower, "postgresql://"):
		return DriverPostgres
	case strings.HasPrefix(lower, "mysql://"):
		return DriverMySQL
	case strings.HasPrefix(lower, "mariadb://"):
		return DriverMariaDB
	default:
		return DriverSQLite
	}
}

func defaultHost(string) string { return "localhost" }

func defaultPort(driver string) string {
	switch driver {
	case DriverMySQL, DriverMariaDB:
		return "3306"
	default:
		return "5432"
	}
}

func defaultName(string) string { return "orange" }

func defaultUser(driver string) string {
	switch driver {
	case DriverMySQL, DriverMariaDB:
		return "root"
	default:
		return "postgres"
	}
}

func defaultPassword(driver string) string {
	switch driver {
	case DriverMySQL, DriverMariaDB:
		return "root"
	default:
		return "postgres"
	}
}

func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(value) == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func envBool(key string, fallback bool) bool {
	value, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(value) == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(strings.TrimSpace(value))
	if err != nil {
		return fallback
	}
	return parsed
}

func splitList(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
