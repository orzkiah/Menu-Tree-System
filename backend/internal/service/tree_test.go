package service

import (
	"testing"

	"menu-tree-backend/internal/domain"

	"github.com/google/uuid"
)

// helper to build a menu with an optional parent.
func mkMenu(id uuid.UUID, title string, parent *uuid.UUID, pos int) domain.Menu {
	return domain.Menu{ID: id, Title: title, ParentID: parent, Position: pos}
}

func TestBuildTree_Nesting(t *testing.T) {
	root := uuid.New()
	child := uuid.New()
	grand := uuid.New()

	menus := []domain.Menu{
		mkMenu(root, "root", nil, 0),
		mkMenu(child, "child", &root, 0),
		mkMenu(grand, "grand", &child, 0),
	}

	tree := buildTree(menus)
	if len(tree) != 1 {
		t.Fatalf("want 1 root, got %d", len(tree))
	}
	if len(tree[0].Children) != 1 || tree[0].Children[0].Title != "child" {
		t.Fatalf("child not nested: %+v", tree[0].Children)
	}
	if len(tree[0].Children[0].Children) != 1 || tree[0].Children[0].Children[0].Title != "grand" {
		t.Fatalf("grandchild not nested")
	}
}

func TestBuildTree_Empty(t *testing.T) {
	tree := buildTree(nil)
	if tree == nil {
		t.Fatal("expected non-nil empty slice")
	}
	if len(tree) != 0 {
		t.Fatalf("expected empty, got %d", len(tree))
	}
}

func TestBuildTree_LeafChildrenInitialized(t *testing.T) {
	id := uuid.New()
	tree := buildTree([]domain.Menu{mkMenu(id, "leaf", nil, 0)})
	if tree[0].Children == nil {
		t.Fatal("leaf children must be an empty slice, not nil")
	}
}

func TestBuildTree_OrphanPromotedToRoot(t *testing.T) {
	// A node whose parent is absent from the set (e.g. during search) becomes a root.
	missingParent := uuid.New()
	orphan := uuid.New()
	tree := buildTree([]domain.Menu{mkMenu(orphan, "orphan", &missingParent, 0)})
	if len(tree) != 1 || tree[0].Title != "orphan" {
		t.Fatalf("orphan should be promoted to root, got %+v", tree)
	}
}

func TestSlugify(t *testing.T) {
	cases := []struct{ slug, title, want string }{
		{"", "System Code", "system-code"},
		{"", "  Hello World!  ", "hello-world"},
		{"custom-slug", "Ignored Title", "custom-slug"},
		{"", "사용자 승인", ""},
	}
	for _, c := range cases {
		if got := slugify(c.slug, c.title); got != c.want {
			t.Errorf("slugify(%q,%q) = %q, want %q", c.slug, c.title, got, c.want)
		}
	}
}
