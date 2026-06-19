package dto

import (
	"time"

	"menu-tree-backend/internal/domain"

	"github.com/google/uuid"
)

// MenuResponse is the API representation of a menu. Children is populated by the
// tree builder in a later phase and omitted when empty.
type MenuResponse struct {
	ID        uuid.UUID      `json:"id"`
	Title     string         `json:"title"`
	Slug      string         `json:"slug"`
	Icon      string         `json:"icon"`
	ParentID  *uuid.UUID     `json:"parentId"`
	Position  int            `json:"position"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	Children  []MenuResponse `json:"children"`
}

// FromMenu maps a domain entity to its API response. Children is initialized to
// an empty slice so it always serializes as [] (never null), even for leaves.
func FromMenu(m domain.Menu) MenuResponse {
	return MenuResponse{
		ID:        m.ID,
		Title:     m.Title,
		Slug:      m.Slug,
		Icon:      m.Icon,
		ParentID:  m.ParentID,
		Position:  m.Position,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
		Children:  []MenuResponse{},
	}
}
