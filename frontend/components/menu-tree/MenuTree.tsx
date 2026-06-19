"use client";

import { ListTree } from "lucide-react";
import { MenuNode } from "@/components/menu-node/MenuNode";
import { useMenuStore } from "@/stores/menu.store";

/** Renders the menu hierarchy from the store, or an empty-state placeholder. */
export function MenuTree() {
  const menus = useMenuStore((s) => s.menus);

  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-400">
        <ListTree className="h-8 w-8" />
        <p className="text-sm">No menus yet.</p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin max-h-[60vh] overflow-y-auto pr-1">
      {menus.map((menu) => (
        <MenuNode key={menu.id} menu={menu} depth={0} />
      ))}
    </div>
  );
}
