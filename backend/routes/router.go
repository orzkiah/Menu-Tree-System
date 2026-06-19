package routes

import (
	"net/http"

	"menu-tree-backend/internal/handler"
	"menu-tree-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// New builds the Gin engine with base middleware and the health endpoint.
func New(log *zap.Logger) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	// Health check — used by Docker/orchestrators and manual verification.
	r.GET("/health", func(c *gin.Context) {
		response.Success(c, http.StatusOK, "service healthy", gin.H{"status": "ok"})
	})

	return r
}

// RegisterMenuRoutes mounts the menu CRUD endpoints under /api/menus.
// Tree (GET collection), move and reorder routes are added in later phases.
func RegisterMenuRoutes(r *gin.Engine, h *handler.MenuHandler) {
	menus := r.Group("/api/menus")
	{
		menus.POST("", h.Create)
		menus.GET("/:id", h.GetByID)
		menus.PUT("/:id", h.Update)
		menus.DELETE("/:id", h.Delete)
	}
}
