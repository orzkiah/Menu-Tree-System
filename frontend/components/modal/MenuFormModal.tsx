"use client";

import { X } from "lucide-react";

interface MenuFormModalProps {
  open: boolean;
  mode?: "create" | "edit";
  onClose: () => void;
}

/**
 * Add/Edit menu modal. Layout mirrors the Figma form panel (Menu ID, Depth,
 * Parent Data, Name). Submission logic is wired in a later phase.
 */
export function MenuFormModal({ open, mode = "create", onClose }: MenuFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {mode === "edit" ? "Edit Menu" : "Add Menu"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4">
          <Field label="Menu ID">
            <input
              disabled
              placeholder="auto-generated"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </Field>
          <Field label="Depth">
            <input
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </Field>
          <Field label="Parent Data">
            <input
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </Field>
          <Field label="Name">
            <input
              placeholder="Menu name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </Field>

          <button
            type="button"
            className="w-full rounded-full bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
