package repository

import (
	"context"
	"errors"
	"strings"

	"menu-tree-backend/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type menuRepository struct {
	db *gorm.DB
}

// NewMenuRepository builds the GORM-backed MenuRepository.
func NewMenuRepository(db *gorm.DB) domain.MenuRepository {
	return &menuRepository{db: db}
}

// WithTx returns a repository bound to the given transaction handle.
func (r *menuRepository) WithTx(tx *gorm.DB) domain.MenuRepository {
	return &menuRepository{db: tx}
}

// FindAll loads all menus in one query, ordered by position. When search is
// non-empty it filters on title/slug (case-insensitive). A single fetch keeps
// tree building free of N+1 queries.
func (r *menuRepository) FindAll(ctx context.Context, search string) ([]domain.Menu, error) {
	var menus []domain.Menu
	q := r.db.WithContext(ctx).Order("position asc, created_at asc")

	if s := strings.TrimSpace(search); s != "" {
		like := "%" + strings.ToLower(s) + "%"
		q = q.Where("LOWER(title) LIKE ? OR LOWER(slug) LIKE ?", like, like)
	}

	if err := q.Find(&menus).Error; err != nil {
		return nil, err
	}
	return menus, nil
}

// FindByID returns the menu, or (nil, nil) when it does not exist.
func (r *menuRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Menu, error) {
	var menu domain.Menu
	err := r.db.WithContext(ctx).First(&menu, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &menu, nil
}

func (r *menuRepository) Create(ctx context.Context, menu *domain.Menu) error {
	return r.db.WithContext(ctx).Create(menu).Error
}

func (r *menuRepository) Update(ctx context.Context, menu *domain.Menu) error {
	return r.db.WithContext(ctx).Save(menu).Error
}

// Delete removes the menu; child rows are removed by the ON DELETE CASCADE FK.
func (r *menuRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.Menu{}, "id = ?", id).Error
}

func (r *menuRepository) ExistsByID(ctx context.Context, id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Menu{}).Where("id = ?", id).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
