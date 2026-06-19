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
	GetTree(ctx context.Context, search string) ([]dto.MenuResponse, error)
	GetByID(ctx context.Context, id uuid.UUID) (*dto.MenuResponse, error)
	Create(ctx context.Context, req dto.CreateMenuRequest) (*dto.MenuResponse, error)
	Update(ctx context.Context, id uuid.UUID, req dto.UpdateMenuRequest) (*dto.MenuResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Move(ctx context.Context, id uuid.UUID, req dto.MoveMenuRequest) (*dto.MenuResponse, error)
	Reorder(ctx context.Context, id uuid.UUID, req dto.ReorderMenuRequest) (*dto.MenuResponse, error)
}

type menuService struct {
	repo domain.MenuRepository
	db   *gorm.DB
}

func NewMenuService(repo domain.MenuRepository, db *gorm.DB) MenuService {
	return &menuService{repo: repo, db: db}
}

// GetTree loads all menus in a single query and assembles them into a nested
// tree. The returned slice is always non-nil (empty when there is no data).
func (s *menuService) GetTree(ctx context.Context, search string) ([]dto.MenuResponse, error) {
	menus, err := s.repo.FindAll(ctx, search)
	if err != nil {
		return nil, err
	}
	return buildTree(menus), nil
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

// Move re-parents a menu to a new parent/position inside a transaction,
// rejecting self-parenting and any move that would create a cycle.
func (s *menuService) Move(ctx context.Context, id uuid.UUID, req dto.MoveMenuRequest) (*dto.MenuResponse, error) {
	if req.ParentID != nil && *req.ParentID == id {
		return nil, apperrors.ErrSelfParent
	}

	var moved domain.Menu
	err := s.db.Transaction(func(tx *gorm.DB) error {
		r := s.repo.WithTx(tx)

		node, err := r.FindByID(ctx, id)
		if err != nil {
			return err
		}
		if node == nil {
			return apperrors.ErrMenuNotFound
		}

		if req.ParentID != nil {
			parent, err := r.FindByID(ctx, *req.ParentID)
			if err != nil {
				return err
			}
			if parent == nil {
				return apperrors.ErrParentNotFound
			}
			// Walk up from the target parent; hitting the node itself means the
			// target is a descendant of the node → cycle.
			cursor := parent
			for cursor != nil {
				if cursor.ID == id {
					return apperrors.ErrCircularReference
				}
				if cursor.ParentID == nil {
					break
				}
				cursor, err = r.FindByID(ctx, *cursor.ParentID)
				if err != nil {
					return err
				}
			}
		}

		if err := r.Move(ctx, id, req.ParentID, req.Position); err != nil {
			return err
		}
		updated, err := r.FindByID(ctx, id)
		if err != nil {
			return err
		}
		moved = *updated
		return nil
	})
	if err != nil {
		return nil, err
	}

	res := dto.FromMenu(moved)
	return &res, nil
}

// Reorder changes a menu's position among its siblings.
func (s *menuService) Reorder(ctx context.Context, id uuid.UUID, req dto.ReorderMenuRequest) (*dto.MenuResponse, error) {
	var updated domain.Menu
	err := s.db.Transaction(func(tx *gorm.DB) error {
		r := s.repo.WithTx(tx)
		node, err := r.FindByID(ctx, id)
		if err != nil {
			return err
		}
		if node == nil {
			return apperrors.ErrMenuNotFound
		}
		if err := r.Reorder(ctx, id, req.Position); err != nil {
			return err
		}
		node.Position = req.Position
		updated = *node
		return nil
	})
	if err != nil {
		return nil, err
	}

	res := dto.FromMenu(updated)
	return &res, nil
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

// buildTree assembles a flat, position-ordered menu list into a nested tree in
// O(n). It groups children by parent in one pass, then builds each root subtree
// recursively (supporting unlimited depth). Nodes whose parent is absent from
// the set — e.g. matches without their parent during a search — are promoted to
// roots so they remain visible.
func buildTree(menus []domain.Menu) []dto.MenuResponse {
	exists := make(map[uuid.UUID]bool, len(menus))
	for i := range menus {
		exists[menus[i].ID] = true
	}

	childrenByParent := make(map[uuid.UUID][]domain.Menu)
	roots := make([]domain.Menu, 0)
	for _, m := range menus {
		if m.ParentID != nil && exists[*m.ParentID] {
			childrenByParent[*m.ParentID] = append(childrenByParent[*m.ParentID], m)
		} else {
			roots = append(roots, m)
		}
	}

	tree := make([]dto.MenuResponse, 0, len(roots))
	for _, root := range roots {
		tree = append(tree, buildNode(root, childrenByParent))
	}
	return tree
}

// buildNode recursively constructs a single menu node and its descendants.
func buildNode(m domain.Menu, childrenByParent map[uuid.UUID][]domain.Menu) dto.MenuResponse {
	node := dto.FromMenu(m)
	for _, child := range childrenByParent[m.ID] {
		node.Children = append(node.Children, buildNode(child, childrenByParent))
	}
	return node
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
