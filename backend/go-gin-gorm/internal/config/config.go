package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Database struct {
	Host     string
	Port     string
	Name     string
	User     string
	Password string
	SSLMode  string
	TimeZone string
}

func (d Database) DSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode, d.TimeZone)
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

func Load() Config {
	accessSeconds := envInt("JWT_ACCESS_EXPIRE", envInt("ACCESS_TOKEN_EXPIRE_SECONDS", 900))
	refreshSeconds := envInt("JWT_REFRESH_EXPIRE", envInt("REFRESH_TOKEN_EXPIRE_SECONDS", 604800))
	return Config{
		Port: env("APP_PORT", env("PORT", "8081")),
		Database: Database{
			Host:     env("DB_HOST", "localhost"),
			Port:     env("DB_PORT", "5432"),
			Name:     env("DB_NAME", "orange"),
			User:     env("DB_USER", "postgres"),
			Password: env("DB_PASSWORD", "postgres"),
			SSLMode:  env("DB_SSLMODE", "disable"),
			TimeZone: env("DB_TIMEZONE", "UTC"),
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
