package handler

import (
	"errors"
	"net/http"

	"menu-tree-backend/internal/dto"
	apperrors "menu-tree-backend/internal/errors"
	"menu-tree-backend/internal/service"
	"menu-tree-backend/internal/validator"
	"menu-tree-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MenuHandler struct {
	svc       service.MenuService
	validator *validator.Validator
}

func NewMenuHandler(svc service.MenuService, v *validator.Validator) *MenuHandler {
	return &MenuHandler{svc: svc, validator: v}
}

// GetTree handles GET /api/menus and GET /api/menus?search=keyword.
// It always returns an array (empty when no menus exist).
func (h *MenuHandler) GetTree(c *gin.Context) {
	tree, err := h.svc.GetTree(c.Request.Context(), c.Query("search"))
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "menus retrieved successfully", tree)
}

// GetByID handles GET /api/menus/:id.
func (h *MenuHandler) GetByID(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	menu, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "menu retrieved successfully", menu)
}

// Create handles POST /api/menus.
func (h *MenuHandler) Create(c *gin.Context) {
	var req dto.CreateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request body", []string{err.Error()})
		return
	}
	if msgs := h.validator.Validate(req); msgs != nil {
		response.Error(c, http.StatusUnprocessableEntity, "validation failed", msgs)
		return
	}

	menu, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusCreated, "menu created successfully", menu)
}

// Update handles PUT /api/menus/:id.
func (h *MenuHandler) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	var req dto.UpdateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request body", []string{err.Error()})
		return
	}
	if msgs := h.validator.Validate(req); msgs != nil {
		response.Error(c, http.StatusUnprocessableEntity, "validation failed", msgs)
		return
	}

	menu, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "menu updated successfully", menu)
}

// Delete handles DELETE /api/menus/:id.
func (h *MenuHandler) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "menu deleted successfully", nil)
}

// parseID extracts and validates the :id path param, writing a 400 on failure.
func parseID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid menu id", []string{"id must be a valid UUID"})
		return uuid.Nil, false
	}
	return id, true
}

// handleError maps domain errors to HTTP status codes.
func (h *MenuHandler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, apperrors.ErrMenuNotFound):
		response.Error(c, http.StatusNotFound, err.Error(), nil)
	case errors.Is(err, apperrors.ErrParentNotFound):
		response.Error(c, http.StatusUnprocessableEntity, err.Error(), nil)
	case errors.Is(err, apperrors.ErrSelfParent):
		response.Error(c, http.StatusUnprocessableEntity, err.Error(), nil)
	default:
		response.Error(c, http.StatusInternalServerError, "internal server error", nil)
	}
}
