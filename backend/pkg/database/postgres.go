package database

import (
	"fmt"

	"menu-tree-backend/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect opens a GORM connection to PostgreSQL using the given DSN.
//
// Example DSN:
//
//	host=localhost user=postgres password=postgres dbname=menu_tree port=5432 sslmode=disable
func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}
	return db, nil
}

// Migrate ensures the pgcrypto extension exists (so gen_random_uuid() is
// available) and then runs GORM AutoMigrate for the Menu entity. AutoMigrate
// creates the self-referencing foreign key with ON DELETE CASCADE.
func Migrate(db *gorm.DB) error {
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).Error; err != nil {
		return fmt.Errorf("create pgcrypto extension: %w", err)
	}
	if err := db.AutoMigrate(&domain.Menu{}); err != nil {
		return fmt.Errorf("auto migrate: %w", err)
	}
	return nil
}
