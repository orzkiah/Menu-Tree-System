package domain

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MenuRepository is the persistence contract for menus. The service layer
// depends on this abstraction (dependency inversion), not on GORM directly.
//
// FindAll, Move and Reorder are added in later phases.
type MenuRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*Menu, error)
	Create(ctx context.Context, menu *Menu) error
	Update(ctx context.Context, menu *Menu) error
	Delete(ctx context.Context, id uuid.UUID) error
	ExistsByID(ctx context.Context, id uuid.UUID) (bool, error)

	// WithTx returns a repository bound to the given transaction so the service
	// can compose multiple operations atomically.
	WithTx(tx *gorm.DB) MenuRepository
}
