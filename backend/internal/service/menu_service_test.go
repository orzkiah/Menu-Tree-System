package service_test

import (
	"context"
	"errors"
	"os"
	"testing"

	"menu-tree-backend/internal/dto"
	apperrors "menu-tree-backend/internal/errors"
	"menu-tree-backend/internal/repository"
	"menu-tree-backend/internal/service"
	"menu-tree-backend/pkg/database"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// newService wires a real repository + service against MENU_TEST_DSN, skipping
// when unset. Transactions require a real *gorm.DB, hence the integration style.
func newService(t *testing.T) (service.MenuService, *gorm.DB) {
	t.Helper()
	dsn := os.Getenv("MENU_TEST_DSN")
	if dsn == "" {
		t.Skip("MENU_TEST_DSN not set; skipping service integration tests")
	}
	db, err := database.Connect(dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	if err := db.Exec("TRUNCATE menus").Error; err != nil {
		t.Fatalf("truncate: %v", err)
	}
	repo := repository.NewMenuRepository(db)
	return service.NewMenuService(repo, db), db
}

func TestService_CreateAndTree(t *testing.T) {
	svc, _ := newService(t)
	ctx := context.Background()

	root, err := svc.Create(ctx, dto.CreateMenuRequest{Title: "system management"})
	if err != nil {
		t.Fatalf("create root: %v", err)
	}
	if root.Slug != "system-management" {
		t.Fatalf("slug autogen failed: %q", root.Slug)
	}
	if _, err := svc.Create(ctx, dto.CreateMenuRequest{Title: "Systems", ParentID: &root.ID}); err != nil {
		t.Fatalf("create child: %v", err)
	}

	tree, err := svc.GetTree(ctx, "")
	if err != nil {
		t.Fatalf("tree: %v", err)
	}
	if len(tree) != 1 || len(tree[0].Children) != 1 {
		t.Fatalf("unexpected tree shape: %+v", tree)
	}
}

func TestService_CreateRejectsMissingParent(t *testing.T) {
	svc, _ := newService(t)
	ctx := context.Background()

	missing := uuid.MustParse("00000000-0000-0000-0000-000000000000")
	_, err := svc.Create(ctx, dto.CreateMenuRequest{Title: "x", ParentID: &missing})
	if !errors.Is(err, apperrors.ErrParentNotFound) {
		t.Fatalf("want ErrParentNotFound, got %v", err)
	}
}

func TestService_MovePreventsCircular(t *testing.T) {
	svc, _ := newService(t)
	ctx := context.Background()

	parent, _ := svc.Create(ctx, dto.CreateMenuRequest{Title: "parent"})
	child, _ := svc.Create(ctx, dto.CreateMenuRequest{Title: "child", ParentID: &parent.ID})

	// Moving the parent under its own child must be rejected.
	_, err := svc.Move(ctx, parent.ID, dto.MoveMenuRequest{ParentID: &child.ID})
	if !errors.Is(err, apperrors.ErrCircularReference) {
		t.Fatalf("want ErrCircularReference, got %v", err)
	}

	// Self-parenting must be rejected.
	_, err = svc.Move(ctx, parent.ID, dto.MoveMenuRequest{ParentID: &parent.ID})
	if !errors.Is(err, apperrors.ErrSelfParent) {
		t.Fatalf("want ErrSelfParent, got %v", err)
	}
}
