package routes

import (
	"net/http"

	"menu-tree-backend/internal/handler"
	"menu-tree-backend/internal/middleware"
	"menu-tree-backend/pkg/response"

	_ "menu-tree-backend/docs" // generated swagger docs

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
)

// New builds the Gin engine with base middleware (recovery + CORS), the health
// endpoint and the Swagger UI.
func New(log *zap.Logger, allowedOrigins []string) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(allowedOrigins))

	// Health check — used by Docker/orchestrators and manual verification.
	r.GET("/health", func(c *gin.Context) {
		response.Success(c, http.StatusOK, "service healthy", gin.H{"status": "ok"})
	})

	// Swagger UI at /swagger/index.html
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return r
}

// RegisterMenuRoutes mounts the menu endpoints under /api/menus.
func RegisterMenuRoutes(r *gin.Engine, h *handler.MenuHandler) {
	menus := r.Group("/api/menus")
	{
		menus.GET("", h.GetTree)
		menus.POST("", h.Create)
		menus.GET("/:id", h.GetByID)
		menus.PUT("/:id", h.Update)
		menus.DELETE("/:id", h.Delete)
		menus.PATCH("/:id/move", h.Move)
		menus.PATCH("/:id/reorder", h.Reorder)
	}
}
