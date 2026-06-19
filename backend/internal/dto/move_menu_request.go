package dto

import "github.com/google/uuid"

// MoveMenuRequest is the payload for PATCH /api/menus/:id/move.
// ParentID may be null to move the menu to the root level.
type MoveMenuRequest struct {
	ParentID *uuid.UUID `json:"parentId"`
	Position int        `json:"position" validate:"gte=0"`
}
