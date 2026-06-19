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
	// FindAll returns every menu (optionally filtered by a title/slug search)
	// in a single query, ordered by position for deterministic tree building.
	FindAll(ctx context.Context, search string) ([]Menu, error)
	FindByID(ctx context.Context, id uuid.UUID) (*Menu, error)
	Create(ctx context.Context, menu *Menu) error
	Update(ctx context.Context, menu *Menu) error
	Delete(ctx context.Context, id uuid.UUID) error
	ExistsByID(ctx context.Context, id uuid.UUID) (bool, error)

	// Move re-parents a menu and sets its position.
	Move(ctx context.Context, id uuid.UUID, parentID *uuid.UUID, position int) error
	// Reorder updates a menu's position among its siblings.
	Reorder(ctx context.Context, id uuid.UUID, position int) error

	// WithTx returns a repository bound to the given transaction so the service
	// can compose multiple operations atomically.
	WithTx(tx *gorm.DB) MenuRepository
}
