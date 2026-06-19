import { create } from "zustand";
import type { Menu } from "@/types/menu";

type FormMode = "create" | "edit";

interface UIState {
  // Form modal
  formOpen: boolean;
  formMode: FormMode;
  formParentId: string | null; // pre-selected parent when adding a child
  editingNode: Menu | null;

  // Delete modal
  deleteOpen: boolean;
  deletingNode: Menu | null;

  openCreate: (parentId?: string | null) => void;
  openEdit: (node: Menu) => void;
  closeForm: () => void;

  openDelete: (node: Menu) => void;
  closeDelete: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  formOpen: false,
  formMode: "create",
  formParentId: null,
  editingNode: null,

  deleteOpen: false,
  deletingNode: null,

  openCreate: (parentId = null) =>
    set({
      formOpen: true,
      formMode: "create",
      formParentId: parentId,
      editingNode: null,
    }),

  openEdit: (node) =>
    set({ formOpen: true, formMode: "edit", editingNode: node, formParentId: null }),

  closeForm: () => set({ formOpen: false, editingNode: null, formParentId: null }),

  openDelete: (node) => set({ deleteOpen: true, deletingNode: node }),
  closeDelete: () => set({ deleteOpen: false, deletingNode: null }),
}));
