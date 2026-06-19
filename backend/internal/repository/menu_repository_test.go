package repository_test

import (
	"context"
	"os"
	"testing"

	"menu-tree-backend/internal/domain"
	"menu-tree-backend/internal/repository"
	"menu-tree-backend/pkg/database"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// testDB opens the database from MENU_TEST_DSN, migrates, and truncates the
// menus table. The whole suite is skipped when the env var is unset so it stays
// safe to run without a database.
func testDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("MENU_TEST_DSN")
	if dsn == "" {
		t.Skip("MENU_TEST_DSN not set; skipping repository integration tests")
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
	return db
}

func TestRepository_CRUD(t *testing.T) {
	db := testDB(t)
	repo := repository.NewMenuRepository(db)
	ctx := context.Background()

	root := &domain.Menu{Title: "root", Slug: "root"}
	if err := repo.Create(ctx, root); err != nil {
		t.Fatalf("create: %v", err)
	}
	if root.ID == uuid.Nil {
		t.Fatal("expected generated UUID")
	}

	found, err := repo.FindByID(ctx, root.ID)
	if err != nil || found == nil {
		t.Fatalf("findByID: %v node=%v", err, found)
	}

	found.Title = "root-renamed"
	if err := repo.Update(ctx, found); err != nil {
		t.Fatalf("update: %v", err)
	}

	all, err := repo.FindAll(ctx, "")
	if err != nil || len(all) != 1 {
		t.Fatalf("findAll: %v len=%d", err, len(all))
	}

	exists, _ := repo.ExistsByID(ctx, root.ID)
	if !exists {
		t.Fatal("expected exists=true")
	}
}

func TestRepository_MoveReorder(t *testing.T) {
	db := testDB(t)
	repo := repository.NewMenuRepository(db)
	ctx := context.Background()

	a := &domain.Menu{Title: "A", Slug: "a"}
	b := &domain.Menu{Title: "B", Slug: "b"}
	_ = repo.Create(ctx, a)
	_ = repo.Create(ctx, b)

	// Move A under B at position 2.
	if err := repo.Move(ctx, a.ID, &b.ID, 2); err != nil {
		t.Fatalf("move: %v", err)
	}
	moved, _ := repo.FindByID(ctx, a.ID)
	if moved.ParentID == nil || *moved.ParentID != b.ID || moved.Position != 2 {
		t.Fatalf("move not applied: %+v", moved)
	}

	// Reorder A to position 5.
	if err := repo.Reorder(ctx, a.ID, 5); err != nil {
		t.Fatalf("reorder: %v", err)
	}
	reordered, _ := repo.FindByID(ctx, a.ID)
	if reordered.Position != 5 {
		t.Fatalf("reorder not applied: pos=%d", reordered.Position)
	}
}

func TestRepository_CascadeDelete(t *testing.T) {
	db := testDB(t)
	repo := repository.NewMenuRepository(db)
	ctx := context.Background()

	parent := &domain.Menu{Title: "parent", Slug: "parent"}
	_ = repo.Create(ctx, parent)
	child := &domain.Menu{Title: "child", Slug: "child", ParentID: &parent.ID}
	_ = repo.Create(ctx, child)

	if err := repo.Delete(ctx, parent.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	// ON DELETE CASCADE must remove the child too.
	if exists, _ := repo.ExistsByID(ctx, child.ID); exists {
		t.Fatal("cascade delete failed: child still exists")
	}
}
