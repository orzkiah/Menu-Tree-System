"use client";

import { ChevronDown, FolderTree, Grid2x2 } from "lucide-react";
import { useEffect } from "react";
import { MenuTree } from "@/components/menu-tree/MenuTree";
import { SearchBar } from "@/components/ui/SearchBar";
import { Sidebar } from "@/components/ui/Sidebar";
import { depthOfId } from "@/lib/tree";
import { useMenuStore } from "@/stores/menu.store";

export default function HomePage() {
  const menus = useMenuStore((s) => s.menus);
  const selectedNode = useMenuStore((s) => s.selectedNode);
  const fetchMenus = useMenuStore((s) => s.fetchMenus);
  const expandAll = useMenuStore((s) => s.expandAll);
  const collapseAll = useMenuStore((s) => s.collapseAll);

  // Load the live menu tree on mount.
  useEffect(() => {
    void fetchMenus();
  }, [fetchMenus]);

  const depth = selectedNode ? depthOfId(menus, selectedNode.id) : 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-4 p-4">
      <Sidebar />

      <main className="flex-1 rounded-2xl bg-white p-6 shadow-sm">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-slate-400">
          <FolderTree className="h-3.5 w-3.5" />
          <span>Menus</span>
        </nav>

        {/* Title */}
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
            <Grid2x2 className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-semibold text-slate-800">Menus</h1>
        </div>

        {/* Menu selector */}
        <div className="mb-5 max-w-sm">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Menu
          </label>
          <div className="relative">
            <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
              <option>system management</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={expandAll}
            className="rounded-full bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-900"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Collapse All
          </button>
          <div className="ml-auto">
            <SearchBar />
          </div>
        </div>

        {/* Tree + details panel */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-slate-100 p-2">
            <MenuTree />
          </div>

          <DetailsPanel
            id={selectedNode?.id ?? ""}
            depth={depth}
            parent={selectedNode?.parentId ?? ""}
            name={selectedNode?.title ?? ""}
          />
        </div>
      </main>
    </div>
  );
}

/** Read-only details/form panel mirroring the Figma right column. */
function DetailsPanel({
  id,
  depth,
  parent,
  name,
}: {
  id: string;
  depth: number;
  parent: string;
  name: string;
}) {
  return (
    <aside className="h-fit space-y-4 rounded-xl bg-slate-50/60 p-5">
      <Field label="Menu ID">
        <input
          readOnly
          value={id}
          placeholder="Select a menu"
          className="w-full truncate rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
        />
      </Field>
      <Field label="Depth">
        <input
          readOnly
          value={depth || ""}
          className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
        />
      </Field>
      <Field label="Parent Data">
        <input
          readOnly
          value={parent || "Root"}
          className="w-full truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </Field>
      <Field label="Name">
        <input
          readOnly
          value={name}
          placeholder="—"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </Field>
      <button
        type="button"
        className="w-full rounded-full bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        Save
      </button>
    </aside>
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
