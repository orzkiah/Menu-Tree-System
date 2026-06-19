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

// GetTree godoc
//
//	@Summary		List menus as a tree
//	@Description	Returns all menus as a nested tree. Optional case-insensitive search by title/slug.
//	@Tags			menus
//	@Produce		json
//	@Param			search	query		string	false	"Search keyword"
//	@Success		200		{object}	response.Body
//	@Failure		500		{object}	response.Body
//	@Router			/menus [get]
func (h *MenuHandler) GetTree(c *gin.Context) {
	tree, err := h.svc.GetTree(c.Request.Context(), c.Query("search"))
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "menus retrieved successfully", tree)
}

// GetByID godoc
//
//	@Summary		Get a menu by ID
//	@Tags			menus
//	@Produce		json
//	@Param			id	path		string	true	"Menu UUID"
//	@Success		200	{object}	response.Body
//	@Failure		400	{object}	response.Body
//	@Failure		404	{object}	response.Body
//	@Router			/menus/{id} [get]
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

// Create godoc
//
//	@Summary		Create a menu
//	@Tags			menus
//	@Accept			json
//	@Produce		json
//	@Param			menu	body		dto.CreateMenuRequest	true	"Menu to create"
//	@Success		201		{object}	response.Body
//	@Failure		400		{object}	response.Body
//	@Failure		422		{object}	response.Body
//	@Router			/menus [post]
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

// Update godoc
//
//	@Summary		Update a menu
//	@Tags			menus
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string					true	"Menu UUID"
//	@Param			menu	body		dto.UpdateMenuRequest	true	"Updated menu"
//	@Success		200		{object}	response.Body
//	@Failure		400		{object}	response.Body
//	@Failure		404		{object}	response.Body
//	@Failure		422		{object}	response.Body
//	@Router			/menus/{id} [put]
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

// Delete godoc
//
//	@Summary		Delete a menu (cascades to children)
//	@Tags			menus
//	@Produce		json
//	@Param			id	path		string	true	"Menu UUID"
//	@Success		200	{object}	response.Body
//	@Failure		400	{object}	response.Body
//	@Failure		404	{object}	response.Body
//	@Router			/menus/{id} [delete]
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

// Move godoc
//
//	@Summary		Move a menu to a new parent/position
//	@Description	Re-parents a menu. Rejects self-parenting and cyclic moves.
//	@Tags			menus
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string				true	"Menu UUID"
//	@Param			move	body		dto.MoveMenuRequest	true	"New parent and position"
//	@Success		200		{object}	response.Body
//	@Failure		400		{object}	response.Body
//	@Failure		404		{object}	response.Body
//	@Failure		422		{object}	response.Body
//	@Router			/menus/{id}/move [patch]
func (h *MenuHandler) Move(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	var req dto.MoveMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request body", []string{err.Error()})
		return
	}
	if msgs := h.validator.Validate(req); msgs != nil {
		response.Error(c, http.StatusUnprocessableEntity, "validation failed", msgs)
		return
	}

	menu, err := h.svc.Move(c.Request.Context(), id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "menu moved successfully", menu)
}

// Reorder godoc
//
//	@Summary		Reorder a menu among its siblings
//	@Tags			menus
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string					true	"Menu UUID"
//	@Param			reorder	body		dto.ReorderMenuRequest	true	"New position"
//	@Success		200		{object}	response.Body
//	@Failure		400		{object}	response.Body
//	@Failure		404		{object}	response.Body
//	@Failure		422		{object}	response.Body
//	@Router			/menus/{id}/reorder [patch]
func (h *MenuHandler) Reorder(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	var req dto.ReorderMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request body", []string{err.Error()})
		return
	}
	if msgs := h.validator.Validate(req); msgs != nil {
		response.Error(c, http.StatusUnprocessableEntity, "validation failed", msgs)
		return
	}

	menu, err := h.svc.Reorder(c.Request.Context(), id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "menu reordered successfully", menu)
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
	case errors.Is(err, apperrors.ErrCircularReference):
		response.Error(c, http.StatusUnprocessableEntity, err.Error(), nil)
	default:
		response.Error(c, http.StatusInternalServerError, "internal server error", nil)
	}
}
