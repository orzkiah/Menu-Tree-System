package dto

import "github.com/google/uuid"

// CreateMenuRequest is the payload for POST /api/menus.
// Slug is optional — the service derives it from the title when omitted.
type CreateMenuRequest struct {
	Title    string     `json:"title" validate:"required,max=255"`
	Slug     string     `json:"slug" validate:"omitempty,max=255"`
	Icon     string     `json:"icon" validate:"omitempty,max=100"`
	ParentID *uuid.UUID `json:"parentId"`
	Position int        `json:"position" validate:"gte=0"`
}
