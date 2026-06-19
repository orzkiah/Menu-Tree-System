"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { flattenForSelect } from "@/lib/tree";
import { useMenuStore } from "@/stores/menu.store";
import { useUIStore } from "@/stores/ui.store";

const MAX_TITLE = 255;

/**
 * Add/Edit menu modal. Controlled form with client + server validation,
 * keyboard support (Esc/Enter), loading submit button and auto-focus.
 */
export function MenuFormModal() {
  const open = useUIStore((s) => s.formOpen);
  const mode = useUIStore((s) => s.formMode);
  const parentIdDefault = useUIStore((s) => s.formParentId);
  const editingNode = useUIStore((s) => s.editingNode);
  const closeForm = useUIStore((s) => s.closeForm);

  const menus = useMenuStore((s) => s.menus);
  const submitting = useMenuStore((s) => s.submitting);
  const createMenu = useMenuStore((s) => s.createMenu);
  const updateMenu = useMenuStore((s) => s.updateMenu);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const titleRef = useRef<HTMLInputElement>(null);

  // Initialize the form whenever the modal opens or the target changes.
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editingNode) {
      setTitle(editingNode.title);
      setSlug(editingNode.slug);
      setIcon(editingNode.icon);
      setParentId(editingNode.parentId);
    } else {
      setTitle("");
      setSlug("");
      setIcon("");
      setParentId(parentIdDefault);
    }
    setTitleError(null);
    setServerErrors([]);
    // Focus the first input after the modal paints.
    const t = setTimeout(() => titleRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, mode, editingNode, parentIdDefault]);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeForm]);

  if (!open) return null;

  const validate = (): boolean => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("Title is required");
      return false;
    }
    if (trimmed.length > MAX_TITLE) {
      setTitleError(`Title must be at most ${MAX_TITLE} characters`);
      return false;
    }
    setTitleError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions
    if (!validate()) return;
    setServerErrors([]);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      icon: icon.trim() || undefined,
      parentId: parentId,
    };

    const result =
      mode === "edit" && editingNode
        ? await updateMenu(editingNode.id, payload)
        : await createMenu(payload);

    if (result.ok) {
      toast.success(
        mode === "edit" ? "Menu updated successfully" : "Menu created successfully",
      );
      closeForm();
    } else {
      setServerErrors(result.errors.length ? result.errors : [result.message]);
      toast.error(mode === "edit" ? "Failed to update menu" : "Failed to create menu");
    }
  };

  const parentOptions = flattenForSelect(menus, editingNode?.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeForm();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {mode === "edit" ? "Edit Menu" : "Add Menu"}
          </h2>
          <button
            onClick={closeForm}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Title" required>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE + 1}
              placeholder="Menu title"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 ${
                titleError
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-brand focus:ring-brand/20"
              }`}
            />
            {titleError && <p className="text-xs text-red-500">{titleError}</p>}
          </Field>

          <Field label="Slug">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated from title if empty"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </Field>

          <Field label="Icon">
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="optional icon name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </Field>

          <Field label="Parent Menu">
            <select
              value={parentId ?? ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
            >
              <option value="">— No parent (root) —</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {`${"  ".repeat(opt.depth)}${opt.label}`}
                </option>
              ))}
            </select>
          </Field>

          {serverErrors.length > 0 && (
            <ul className="space-y-1 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              {serverErrors.map((msg, i) => (
                <li key={i}>• {msg}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
