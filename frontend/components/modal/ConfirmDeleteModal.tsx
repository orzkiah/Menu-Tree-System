"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useMenuStore } from "@/stores/menu.store";
import { useUIStore } from "@/stores/ui.store";

/** Confirmation dialog for destructive deletes (cascades to children). */
export function ConfirmDeleteModal() {
  const open = useUIStore((s) => s.deleteOpen);
  const node = useUIStore((s) => s.deletingNode);
  const closeDelete = useUIStore((s) => s.closeDelete);

  const submitting = useMenuStore((s) => s.submitting);
  const deleteMenu = useMenuStore((s) => s.deleteMenu);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDelete();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDelete]);

  if (!open || !node) return null;

  const handleConfirm = async () => {
    if (submitting) return; // prevent duplicate submissions
    const result = await deleteMenu(node.id);
    if (result.ok) {
      toast.success("Menu deleted successfully");
      closeDelete();
    } else {
      toast.error("Failed to delete menu");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeDelete();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-slate-800">Delete Menu</h2>
        <p className="mt-2 text-sm text-slate-500">
          This action cannot be undone. Deleting a menu also deletes all of its
          children.
        </p>
        <p className="mt-2 truncate text-sm font-medium text-slate-700">
          “{node.title}”
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={closeDelete}
            disabled={submitting}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
