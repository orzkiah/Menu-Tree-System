package dto

import "github.com/google/uuid"

// UpdateMenuRequest is the payload for PUT /api/menus/:id.
// ParentID may be null to move the menu to the root level.
type UpdateMenuRequest struct {
	Title    string     `json:"title" validate:"required,max=255"`
	Slug     string     `json:"slug" validate:"omitempty,max=255"`
	Icon     string     `json:"icon" validate:"omitempty,max=100"`
	ParentID *uuid.UUID `json:"parentId"`
	Position int        `json:"position" validate:"gte=0"`
}
