import { create } from "zustand";
import type { Menu } from "@/types/menu";

interface MenuState {
  // Data
  menus: Menu[];
  selectedNode: Menu | null;

  // UI state
  expandedNodes: Set<string>;
  searchTerm: string;
  loading: boolean;
  error: string | null;

  // Setters (data fetching & CRUD are added in a later phase)
  setMenus: (menus: Menu[]) => void;
  setSelectedNode: (node: Menu | null) => void;
  toggleExpand: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
  setSearch: (term: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menus: [],
  selectedNode: null,
  expandedNodes: new Set<string>(),
  searchTerm: "",
  loading: false,
  error: null,

  setMenus: (menus) => set({ menus }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),

  toggleExpand: (id) =>
    set((state) => {
      const next = new Set(state.expandedNodes);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedNodes: next };
    }),

  expandAll: (ids) => set({ expandedNodes: new Set(ids) }),
  collapseAll: () => set({ expandedNodes: new Set<string>() }),

  setSearch: (searchTerm) => set({ searchTerm }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
