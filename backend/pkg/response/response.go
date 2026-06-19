package response

import "github.com/gin-gonic/gin"

// Body is the standard API response envelope used across all endpoints.
type Body struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

// Success writes a successful JSON response.
func Success(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, Body{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error writes a failure JSON response. The errors argument is optional detail
// (e.g. a slice of validation messages) and may be nil.
func Error(c *gin.Context, status int, message string, errors interface{}) {
	c.JSON(status, Body{
		Success: false,
		Message: message,
		Errors:  errors,
	})
}
