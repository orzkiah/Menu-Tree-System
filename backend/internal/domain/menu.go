package domain

import (
	"time"

	"github.com/google/uuid"
)

// Menu is the core entity: a self-referencing tree node with unlimited nesting.
//
// ParentID is nullable — a NULL parent marks a root-level menu. The self-
// referencing foreign key is created by GORM AutoMigrate with ON DELETE CASCADE,
// so removing a parent deletes its entire subtree at the database level.
type Menu struct {
	ID       uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Title    string     `gorm:"type:varchar(255);not null" json:"title"`
	Slug     string     `gorm:"type:varchar(255);not null" json:"slug"`
	Icon     string     `gorm:"type:varchar(100)" json:"icon"`
	ParentID *uuid.UUID `gorm:"type:uuid;index" json:"parentId"`
	Position int        `gorm:"not null;default:0" json:"position"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Children is populated by the service layer's recursive tree builder.
	// It is never persisted as a column; the self-referencing FK below drives it.
	Children []Menu `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"children,omitempty"`
}

// TableName pins the table name so it stays "menus" regardless of pluralization rules.
func (Menu) TableName() string {
	return "menus"
}
