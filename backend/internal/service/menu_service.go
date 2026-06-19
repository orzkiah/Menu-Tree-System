package service

import (
	"context"
	"regexp"
	"strings"

	"menu-tree-backend/internal/domain"
	"menu-tree-backend/internal/dto"
	apperrors "menu-tree-backend/internal/errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MenuService defines the business operations for menus.
// Tree retrieval, Move and Reorder are added in later phases.
type MenuService interface {
	GetByID(ctx context.Context, id uuid.UUID) (*dto.MenuResponse, error)
	Create(ctx context.Context, req dto.CreateMenuRequest) (*dto.MenuResponse, error)
	Update(ctx context.Context, id uuid.UUID, req dto.UpdateMenuRequest) (*dto.MenuResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type menuService struct {
	repo domain.MenuRepository
	db   *gorm.DB
}

func NewMenuService(repo domain.MenuRepository, db *gorm.DB) MenuService {
	return &menuService{repo: repo, db: db}
}

func (s *menuService) GetByID(ctx context.Context, id uuid.UUID) (*dto.MenuResponse, error) {
	menu, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if menu == nil {
		return nil, apperrors.ErrMenuNotFound
	}
	res := dto.FromMenu(*menu)
	return &res, nil
}

// Create inserts a menu inside a transaction, verifying parent existence first.
func (s *menuService) Create(ctx context.Context, req dto.CreateMenuRequest) (*dto.MenuResponse, error) {
	menu := &domain.Menu{
		Title:    req.Title,
		Slug:     slugify(req.Slug, req.Title),
		Icon:     req.Icon,
		ParentID: req.ParentID,
		Position: req.Position,
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		r := s.repo.WithTx(tx)
		if err := ensureParentExists(ctx, r, req.ParentID); err != nil {
			return err
		}
		return r.Create(ctx, menu)
	})
	if err != nil {
		return nil, err
	}

	res := dto.FromMenu(*menu)
	return &res, nil
}

// Update mutates an existing menu inside a transaction. It rejects self-parenting
// and validates the new parent's existence.
func (s *menuService) Update(ctx context.Context, id uuid.UUID, req dto.UpdateMenuRequest) (*dto.MenuResponse, error) {
	if req.ParentID != nil && *req.ParentID == id {
		return nil, apperrors.ErrSelfParent
	}

	var updated domain.Menu
	err := s.db.Transaction(func(tx *gorm.DB) error {
		r := s.repo.WithTx(tx)

		existing, err := r.FindByID(ctx, id)
		if err != nil {
			return err
		}
		if existing == nil {
			return apperrors.ErrMenuNotFound
		}
		if err := ensureParentExists(ctx, r, req.ParentID); err != nil {
			return err
		}

		existing.Title = req.Title
		existing.Slug = slugify(req.Slug, req.Title)
		existing.Icon = req.Icon
		existing.ParentID = req.ParentID
		existing.Position = req.Position

		if err := r.Update(ctx, existing); err != nil {
			return err
		}
		updated = *existing
		return nil
	})
	if err != nil {
		return nil, err
	}

	res := dto.FromMenu(updated)
	return &res, nil
}

// Delete removes a menu; its subtree is removed via ON DELETE CASCADE.
func (s *menuService) Delete(ctx context.Context, id uuid.UUID) error {
	exists, err := s.repo.ExistsByID(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return apperrors.ErrMenuNotFound
	}
	return s.repo.Delete(ctx, id)
}

// ensureParentExists validates that a referenced parent exists (no-op for roots).
func ensureParentExists(ctx context.Context, r domain.MenuRepository, parentID *uuid.UUID) error {
	if parentID == nil {
		return nil
	}
	ok, err := r.ExistsByID(ctx, *parentID)
	if err != nil {
		return err
	}
	if !ok {
		return apperrors.ErrParentNotFound
	}
	return nil
}

var nonAlphanumeric = regexp.MustCompile(`[^a-z0-9]+`)

// slugify returns the provided slug, or derives a URL-friendly slug from the
// title when no slug was supplied.
func slugify(slug, title string) string {
	if strings.TrimSpace(slug) != "" {
		return slug
	}
	s := strings.ToLower(strings.TrimSpace(title))
	s = nonAlphanumeric.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}
