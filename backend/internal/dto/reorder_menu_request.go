package dto

// ReorderMenuRequest is the payload for PATCH /api/menus/:id/reorder.
// It changes a menu's position among its siblings.
type ReorderMenuRequest struct {
	Position int `json:"position" validate:"gte=0"`
}
