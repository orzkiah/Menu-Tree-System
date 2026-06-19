"use client";

import { Trash2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation dialog for destructive deletes. Wiring happens in a later phase. */
export function ConfirmDeleteModal({
  open,
  title,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-slate-800">Delete menu?</h2>
        <p className="mt-1 text-sm text-slate-500">
          {title ? (
            <>
              This will permanently delete{" "}
              <span className="font-medium text-slate-700">{title}</span> and all
              of its children.
            </>
          ) : (
            "This will permanently delete the menu and all of its children."
          )}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
