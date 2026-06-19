package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// New builds a Zap logger. In production it emits structured JSON; in
// development it uses the human-friendly console encoder. The level string
// ("debug", "info", "warn", "error") controls verbosity.
func New(level string, production bool) (*zap.Logger, error) {
	var cfg zap.Config
	if production {
		cfg = zap.NewProductionConfig()
	} else {
		cfg = zap.NewDevelopmentConfig()
		cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	if lvl, err := zapcore.ParseLevel(level); err == nil {
		cfg.Level = zap.NewAtomicLevelAt(lvl)
	}

	return cfg.Build()
}
