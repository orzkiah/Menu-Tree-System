import { create } from "zustand";
import type { CreateMenuInput, Menu, UpdateMenuInput } from "@/types/menu";
import { menuService } from "@/services/menu.service";
import { getErrorMessage } from "@/lib/errors";
import { collectIds } from "@/lib/tree";

interface MenuState {
  // State
  menus: Menu[];
  selectedNode: Menu | null;
  expandedNodes: Set<string>;
  searchTerm: string;
  loading: boolean;
  error: string | null;

  // Async actions
  fetchMenus: () => Promise<void>;
  fetchMenu: (id: string) => Promise<void>;
  createMenu: (payload: CreateMenuInput) => Promise<void>;
  updateMenu: (id: string, payload: UpdateMenuInput) => Promise<void>;
  deleteMenu: (id: string) => Promise<void>;

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

  // Create / update / delete refresh the tree on success.
  createMenu: async (payload) => {
    set({ loading: true, error: null });
    try {
      await menuService.create(payload);
      await get().fetchMenus();
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  updateMenu: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      await menuService.update(id, payload);
      await get().fetchMenus();
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  deleteMenu: async (id) => {
    set({ loading: true, error: null });
    try {
      await menuService.remove(id);
      if (get().selectedNode?.id === id) {
        set({ selectedNode: null });
      }
      await get().fetchMenus();
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
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
