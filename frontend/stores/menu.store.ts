import { create } from "zustand";
import type { CreateMenuInput, Menu, UpdateMenuInput } from "@/types/menu";
import { menuService } from "@/services/menu.service";
import { getErrorMessage, parseApiError } from "@/lib/errors";
import { collectIds } from "@/lib/tree";

/** Result of a create/update/delete mutation, consumed by the modals. */
export interface MutationResult {
  ok: boolean;
  message: string;
  errors: string[];
}

interface MenuState {
  // State
  menus: Menu[];
  selectedNode: Menu | null;
  expandedNodes: Set<string>;
  searchTerm: string;
  loading: boolean;
  submitting: boolean;
  error: string | null;

  // Async actions
  fetchMenus: () => Promise<void>;
  fetchMenu: (id: string) => Promise<void>;
  createMenu: (payload: CreateMenuInput) => Promise<MutationResult>;
  updateMenu: (id: string, payload: UpdateMenuInput) => Promise<MutationResult>;
  deleteMenu: (id: string) => Promise<MutationResult>;

  // UI actions
  setSelectedNode: (node: Menu | null) => void;
  setSearchTerm: (term: string) => void;
  toggleNode: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  clearError: () => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: [],
  selectedNode: null,
  expandedNodes: new Set<string>(),
  searchTerm: "",
  loading: false,
  submitting: false,
  error: null,

  // Loads the full menu tree.
  fetchMenus: async () => {
    set({ loading: true, error: null });
    try {
      const menus = await menuService.getTree();
      set({ menus, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  // Loads a single menu and selects it.
  fetchMenu: async (id) => {
    set({ loading: true, error: null });
    try {
      const node = await menuService.getById(id);
      set({ selectedNode: node, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  // Create / update / delete refresh the tree on success and return a result
  // (they intentionally do NOT set the global `error`, which is reserved for the
  // tree fetch, so a failed submit keeps the modal open without breaking the tree).
  createMenu: async (payload) => {
    set({ submitting: true });
    try {
      const created = await menuService.create(payload);
      await get().fetchMenus();
      set((state) => {
        // Expand the parent so the new node is visible, then select it.
        const expandedNodes = new Set(state.expandedNodes);
        if (created.parentId) expandedNodes.add(created.parentId);
        return { expandedNodes, selectedNode: created, submitting: false };
      });
      return { ok: true, message: "", errors: [] };
    } catch (err) {
      set({ submitting: false });
      return { ok: false, ...parseApiError(err) };
    }
  },

  updateMenu: async (id, payload) => {
    set({ submitting: true });
    try {
      const updated = await menuService.update(id, payload);
      await get().fetchMenus(); // expandedNodes is preserved across refresh
      set({ selectedNode: updated, submitting: false });
      return { ok: true, message: "", errors: [] };
    } catch (err) {
      set({ submitting: false });
      return { ok: false, ...parseApiError(err) };
    }
  },

  deleteMenu: async (id) => {
    set({ submitting: true });
    try {
      await menuService.remove(id);
      set((state) => ({
        selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
      }));
      await get().fetchMenus();
      set({ submitting: false });
      return { ok: true, message: "", errors: [] };
    } catch (err) {
      set({ submitting: false });
      return { ok: false, ...parseApiError(err) };
    }
  },

  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),

  toggleNode: (id) =>
    set((state) => {
      const next = new Set(state.expandedNodes);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedNodes: next };
    }),

  expandAll: () => set((state) => ({ expandedNodes: new Set(collectIds(state.menus)) })),
  collapseAll: () => set({ expandedNodes: new Set<string>() }),
  clearError: () => set({ error: null }),
}));
