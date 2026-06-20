package configs

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/viper"
)

// Config holds all application configuration, populated from environment
// variables (and an optional .env file in development).
type Config struct {
	AppEnv  string
	AppPort string

	DB       DBConfig
	LogLevel string

	CORSAllowedOrigins []string
}

// DBConfig holds PostgreSQL connection settings.
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

// DSN builds the GORM/pgx connection string.
func (d DBConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode,
	)
}

// IsProduction reports whether the app runs in a production environment.
func (c Config) IsProduction() bool {
	return strings.EqualFold(c.AppEnv, "production")
}

// Load reads configuration from environment variables, falling back to an
// optional .env file and then to sane defaults.
func Load() (*Config, error) {
	v := viper.New()

	// Defaults — the app boots even with no .env present.
	v.SetDefault("APP_ENV", "development")
	v.SetDefault("APP_PORT", "8080")
	v.SetDefault("DB_HOST", "localhost")
	v.SetDefault("DB_PORT", "5432")
	v.SetDefault("DB_USER", "postgres")
	v.SetDefault("DB_PASSWORD", "postgres")
	v.SetDefault("DB_NAME", "menu_tree")
	v.SetDefault("DB_SSLMODE", "disable")
	v.SetDefault("LOG_LEVEL", "info")
	v.SetDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000")

	// Optional .env file (ignored if absent — real env vars take precedence).
	v.SetConfigName(".env")
	v.SetConfigType("env")
	v.AddConfigPath(".")
	_ = v.ReadInConfig()

	// Real environment variables always win.
	v.AutomaticEnv()

	cfg := &Config{
		AppEnv:   v.GetString("APP_ENV"),
		AppPort:  v.GetString("APP_PORT"),
		LogLevel: v.GetString("LOG_LEVEL"),
		DB: DBConfig{
			Host:     v.GetString("DB_HOST"),
			Port:     v.GetString("DB_PORT"),
			User:     v.GetString("DB_USER"),
			Password: v.GetString("DB_PASSWORD"),
			Name:     v.GetString("DB_NAME"),
			SSLMode:  v.GetString("DB_SSLMODE"),
		},
		CORSAllowedOrigins: splitAndTrim(v.GetString("CORS_ALLOWED_ORIGINS")),
	}

	// Many PaaS platforms (Render, Cloud Run, Railway, Heroku) inject the port
	// to listen on via the PORT env var — prefer it when present.
	if port := os.Getenv("PORT"); port != "" {
		cfg.AppPort = port
	}

	return cfg, nil
}

// splitAndTrim turns a comma-separated string into a clean slice.
func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
