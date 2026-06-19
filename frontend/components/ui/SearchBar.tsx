"use client";

import { Search } from "lucide-react";
import { useMenuStore } from "@/stores/menu.store";

/** Search input bound to the store's searchTerm; filtering happens in MenuTree. */
export function SearchBar() {
  const searchTerm = useMenuStore((s) => s.searchTerm);
  const setSearchTerm = useMenuStore((s) => s.setSearchTerm);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search menu..."
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
