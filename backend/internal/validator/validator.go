// Package validator wraps go-playground/validator to return flat, human-readable
// messages suitable for the API error envelope.
package validator

import (
	"fmt"

	"github.com/go-playground/validator/v10"
)

type Validator struct {
	v *validator.Validate
}

func New() *Validator {
	return &Validator{v: validator.New()}
}

// Validate checks struct tags and returns a slice of messages, or nil if valid.
func (val *Validator) Validate(s any) []string {
	err := val.v.Struct(s)
	if err == nil {
		return nil
	}

	var msgs []string
	for _, fe := range err.(validator.ValidationErrors) {
		msgs = append(msgs, message(fe))
	}
	return msgs
}

func message(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", fe.Field())
	case "max":
		return fmt.Sprintf("%s must be at most %s characters", fe.Field(), fe.Param())
	case "gte":
		return fmt.Sprintf("%s must be greater than or equal to %s", fe.Field(), fe.Param())
	default:
		return fmt.Sprintf("%s is invalid", fe.Field())
	}
}
