import { describe, expect, it } from "vitest";
import type { Menu } from "@/types/menu";
import { collectIds, depthOfId, filterTree, flattenForSelect } from "@/lib/tree";

// Minimal menu factory for tests.
const node = (id: string, title: string, children: Menu[] = []): Menu => ({
  id,
  title,
  slug: title.toLowerCase(),
  icon: "",
  parentId: null,
  position: 0,
  createdAt: "",
  updatedAt: "",
  children,
});

const tree: Menu[] = [
  node("1", "system management", [
    node("2", "Systems", [node("3", "System Code", [node("4", "Code Registration")])]),
    node("5", "Users & Groups", [node("6", "Users")]),
  ]),
];

describe("collectIds", () => {
  it("collects every id in the tree", () => {
    expect(collectIds(tree).sort()).toEqual(["1", "2", "3", "4", "5", "6"]);
  });
});

describe("depthOfId", () => {
  it("returns 1-based depth", () => {
    expect(depthOfId(tree, "1")).toBe(1);
    expect(depthOfId(tree, "3")).toBe(3);
    expect(depthOfId(tree, "4")).toBe(4);
  });
  it("returns 0 when not found", () => {
    expect(depthOfId(tree, "nope")).toBe(0);
  });
});

describe("filterTree", () => {
  it("returns the whole tree for an empty query", () => {
    expect(filterTree(tree, "")).toBe(tree);
  });

  it("keeps a matching node with its full subtree", () => {
    const res = filterTree(tree, "systems");
    expect(res).toHaveLength(1);
    expect(res[0].children).toHaveLength(1);
    expect(res[0].children[0].title).toBe("Systems");
    // Matching node keeps descendants.
    expect(res[0].children[0].children[0].title).toBe("System Code");
  });

  it("keeps ancestors of a deep match and prunes other branches", () => {
    const res = filterTree(tree, "code registration");
    expect(res[0].children.map((c) => c.title)).toEqual(["Systems"]);
    expect(res[0].children[0].children[0].children[0].title).toBe("Code Registration");
  });

  it("is case-insensitive", () => {
    expect(filterTree(tree, "USERS")).toHaveLength(1);
  });

  it("returns empty when nothing matches", () => {
    expect(filterTree(tree, "zzz")).toHaveLength(0);
  });
});

describe("flattenForSelect", () => {
  it("flattens with depth and excludes a node + its descendants", () => {
    const opts = flattenForSelect(tree, "2");
    const labels = opts.map((o) => o.label);
    expect(labels).toContain("system management");
    expect(labels).not.toContain("Systems"); // excluded
    expect(labels).not.toContain("System Code"); // descendant of excluded
    expect(labels).toContain("Users & Groups");
  });
});
