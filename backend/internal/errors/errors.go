// Package apperrors defines typed, sentinel domain errors so the handler layer
// can map them to HTTP status codes via errors.Is.
package apperrors

import "errors"

var (
	// ErrMenuNotFound is returned when a menu does not exist.
	ErrMenuNotFound = errors.New("menu not found")

	// ErrParentNotFound is returned when the referenced parent menu does not exist.
	ErrParentNotFound = errors.New("parent menu not found")

	// ErrSelfParent is returned when a menu is set as its own parent.
	ErrSelfParent = errors.New("a menu cannot be its own parent")

	// ErrCircularReference is returned when a move would create a cycle (moving a
	// menu under one of its own descendants).
	ErrCircularReference = errors.New("cannot move a menu under its own descendant")
)
