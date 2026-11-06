package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/orange/backend-go-gin-gorm/internal/auth"
	"github.com/orange/backend-go-gin-gorm/internal/config"
	web "github.com/orange/backend-go-gin-gorm/internal/http"
	"github.com/orange/backend-go-gin-gorm/internal/service"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

func main() {
	// Local generated configuration; absent in containers that inject env vars.
	_ = godotenv.Load(".env.local")
	cfg := config.Load()

	if environment := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV"))); (environment == "production" || environment == "prod") &&
		cfg.JWT.Secret == "orange-dev-secret-change-me-in-production" {
		log.Fatal("JWT_SECRET must be set to a non-default value in production")
	}

	tokens, err := auth.NewTokenService(cfg.JWT)
	if err != nil {
		log.Fatalf("configure JWT: %v", err)
	}
	dsn, err := cfg.Database.DSN()
	if err != nil {
		log.Fatalf("configure database: %v", err)
	}
	st, err := store.Open(cfg.Database.Driver, dsn)
	if err != nil {
		log.Fatalf("connect %s database: %v", cfg.Database.Driver, err)
	}

	svc := service.New(st, tokens, cfg.Lockout)
	gin.SetMode(gin.ReleaseMode)
	router := web.NewRouter(svc, st, cfg)

	go cleanupOperationLogs(st, cfg.OperationLogRetentionDays)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("ORANGE Go backend listening on http://localhost:%s/api/v1", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("http server: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	if sqlDB, err := st.DB().DB(); err == nil {
		_ = sqlDB.Close()
	}
}

// cleanupOperationLogs enforces the 90-day default retention documented in
// docs/API.md. It runs once at boot and then daily.
func cleanupOperationLogs(st *store.Store, retentionDays int) {
	if retentionDays <= 0 {
		return
	}
	run := func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		before := time.Now().AddDate(0, 0, -retentionDays)
		deleted, err := st.CleanupOperationLogs(ctx, before)
		if err != nil {
			log.Printf("operation log cleanup: %v", err)
			return
		}
		if deleted > 0 {
			log.Printf("operation log cleanup removed %d rows older than %s", deleted, before.Format(time.RFC3339))
		}
	}
	run()
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		run()
	}
}
