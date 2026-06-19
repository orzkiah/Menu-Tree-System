import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Menu } from "@/types/menu";

// Mock the API client so the store can be tested without a network.
vi.mock("@/services/menu.service", () => ({
  menuService: {
    getTree: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { menuService } from "@/services/menu.service";
import { useMenuStore } from "@/stores/menu.store";

const node = (id: string, parentId: string | null = null): Menu => ({
  id,
  title: `node-${id}`,
  slug: id,
  icon: "",
  parentId,
  position: 0,
  createdAt: "",
  updatedAt: "",
  children: [],
});

const reset = () =>
  useMenuStore.setState({
    menus: [],
    selectedNode: null,
    expandedNodes: new Set(),
    searchTerm: "",
    loading: false,
    submitting: false,
    error: null,
  });

describe("menu store — UI actions", () => {
  beforeEach(reset);

  it("toggleNode adds and removes ids", () => {
    useMenuStore.getState().toggleNode("a");
    expect(useMenuStore.getState().expandedNodes.has("a")).toBe(true);
    useMenuStore.getState().toggleNode("a");
    expect(useMenuStore.getState().expandedNodes.has("a")).toBe(false);
  });

  it("expandAll expands every node id; collapseAll clears", () => {
    useMenuStore.setState({ menus: [{ ...node("1"), children: [node("2", "1")] }] });
    useMenuStore.getState().expandAll();
    expect(useMenuStore.getState().expandedNodes.size).toBe(2);
    useMenuStore.getState().collapseAll();
    expect(useMenuStore.getState().expandedNodes.size).toBe(0);
  });

  it("setSearchTerm and clearError update state", () => {
    useMenuStore.getState().setSearchTerm("abc");
    expect(useMenuStore.getState().searchTerm).toBe("abc");
    useMenuStore.setState({ error: "boom" });
    useMenuStore.getState().clearError();
    expect(useMenuStore.getState().error).toBeNull();
  });
});

describe("menu store — async actions", () => {
  beforeEach(() => {
    reset();
    vi.clearAllMocks();
  });

  it("fetchMenus stores the tree and clears loading", async () => {
    vi.mocked(menuService.getTree).mockResolvedValue([node("1")]);
    await useMenuStore.getState().fetchMenus();
    const s = useMenuStore.getState();
    expect(s.menus).toHaveLength(1);
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("fetchMenus sets error on failure", async () => {
    vi.mocked(menuService.getTree).mockRejectedValue(new Error("Network Error"));
    await useMenuStore.getState().fetchMenus();
    expect(useMenuStore.getState().error).toBe("Network Error");
  });

  it("createMenu returns ok, refreshes tree, expands parent and selects node", async () => {
    const created = node("child", "parent");
    vi.mocked(menuService.create).mockResolvedValue(created);
    vi.mocked(menuService.getTree).mockResolvedValue([node("parent")]);

    const result = await useMenuStore.getState().createMenu({ title: "child", parentId: "parent" });

    expect(result.ok).toBe(true);
    expect(menuService.getTree).toHaveBeenCalledOnce();
    expect(useMenuStore.getState().expandedNodes.has("parent")).toBe(true);
    expect(useMenuStore.getState().selectedNode?.id).toBe("child");
  });

  it("createMenu returns parsed errors on failure", async () => {
    vi.mocked(menuService.create).mockRejectedValue(new Error("Failed"));
    const result = await useMenuStore.getState().createMenu({ title: "x" });
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Failed");
  });

  it("deleteMenu clears the selection when the deleted node was selected", async () => {
    useMenuStore.setState({ selectedNode: node("gone") });
    vi.mocked(menuService.remove).mockResolvedValue();
    vi.mocked(menuService.getTree).mockResolvedValue([]);

    const result = await useMenuStore.getState().deleteMenu("gone");

    expect(result.ok).toBe(true);
    expect(useMenuStore.getState().selectedNode).toBeNull();
  });
});
