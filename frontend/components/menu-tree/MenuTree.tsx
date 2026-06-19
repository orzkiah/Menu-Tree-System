"use client";

import { ListTree, Plus, SearchX } from "lucide-react";
import { MenuNode } from "@/components/menu-node/MenuNode";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { filterTree } from "@/lib/tree";
import { useMenuStore } from "@/stores/menu.store";
import { useUIStore } from "@/stores/ui.store";

/**
 * Renders the live menu hierarchy from the store, handling loading, error,
 * empty and no-results states. Search filtering is applied client-side.
 */
export function MenuTree() {
  const menus = useMenuStore((s) => s.menus);
  const searchTerm = useMenuStore((s) => s.searchTerm);
  const loading = useMenuStore((s) => s.loading);
  const error = useMenuStore((s) => s.error);
  const fetchMenus = useMenuStore((s) => s.fetchMenus);
  const openCreate = useUIStore((s) => s.openCreate);

  // Loading (initial fetch — no data yet).
  if (loading && menus.length === 0) {
    return <LoadingSkeleton />;
  }

  // Error.
  if (error) {
    return <ErrorState message={error} onRetry={() => void fetchMenus()} />;
  }

  // Empty (no menus in the system).
  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-12 text-center text-slate-400">
        <ListTree className="mb-1 h-8 w-8" />
        <p className="text-sm font-medium text-slate-500">No menus available.</p>
        <p className="text-xs">Create your first menu.</p>
        <button
          onClick={() => openCreate(null)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Create Menu
        </button>
      </div>
    );
  }

  // No search matches.
  const filtered = filterTree(menus, searchTerm);
  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-400">
        <SearchX className="h-8 w-8" />
        <p className="text-sm">
          No menus match <span className="font-medium">“{searchTerm}”</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin max-h-[60vh] overflow-y-auto pr-1">
      {filtered.map((menu) => (
        <MenuNode key={menu.id} menu={menu} guides={[]} />
      ))}
    </div>
  );
}
