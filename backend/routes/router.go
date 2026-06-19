package routes

import (
	"net/http"

	"menu-tree-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// New builds the Gin engine with base middleware and the health endpoint.
// Menu routes are registered in later phases via RegisterMenuRoutes.
func New(log *zap.Logger) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	// Health check — used by Docker/orchestrators and manual verification.
	r.GET("/health", func(c *gin.Context) {
		response.Success(c, http.StatusOK, "service healthy", gin.H{"status": "ok"})
	})

	return r
}
