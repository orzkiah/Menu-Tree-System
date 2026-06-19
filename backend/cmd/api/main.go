package main

import (
	"context"
	"errors"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"menu-tree-backend/configs"
	"menu-tree-backend/internal/handler"
	"menu-tree-backend/internal/repository"
	"menu-tree-backend/internal/service"
	"menu-tree-backend/internal/validator"
	"menu-tree-backend/pkg/database"
	"menu-tree-backend/pkg/logger"
	"menu-tree-backend/routes"

	"go.uber.org/zap"
)

func main() {
	// 1. Configuration.
	cfg, err := configs.Load()
	if err != nil {
		panic(err)
	}

	// 2. Logger.
	log, err := logger.New(cfg.LogLevel, cfg.IsProduction())
	if err != nil {
		panic(err)
	}
	defer func() { _ = log.Sync() }()

	// 3. Database + AutoMigrate on startup.
	db, err := database.Connect(cfg.DB.DSN())
	if err != nil {
		log.Fatal("database connection failed", zap.Error(err))
	}
	if err := database.Migrate(db); err != nil {
		log.Fatal("auto migration failed", zap.Error(err))
	}
	log.Info("database connected and migrated")

	// 4. Dependency wiring: repository -> service -> handler.
	menuRepo := repository.NewMenuRepository(db)
	menuSvc := service.NewMenuService(menuRepo, db)
	menuHandler := handler.NewMenuHandler(menuSvc, validator.New())

	// 5. HTTP server.
	router := routes.New(log)
	routes.RegisterMenuRoutes(router, menuHandler)
	srv := &http.Server{
		Addr:    ":" + cfg.AppPort,
		Handler: router,
	}

	// Listen for OS interrupt/terminate to trigger graceful shutdown.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Info("server starting", zap.String("port", cfg.AppPort))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal("server failed", zap.Error(err))
		}
	}()

	// 6. Graceful shutdown — wait for signal, then drain with a timeout.
	<-ctx.Done()
	log.Info("shutdown signal received, draining connections")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("graceful shutdown failed", zap.Error(err))
	}

	if sqlDB, err := db.DB(); err == nil {
		_ = sqlDB.Close()
	}
	log.Info("server stopped cleanly")
}
