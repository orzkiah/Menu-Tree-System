"use client";

import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { Menu } from "@/types/menu";
import { useMenuStore } from "@/stores/menu.store";
import { useUIStore } from "@/stores/ui.store";

interface MenuNodeProps {
  menu: Menu;
  depth: number;
}

/**
 * A single tree row. Renders its children recursively, supporting unlimited
 * nesting. Expand/collapse and selection are driven by the store; add/edit/
 * delete actions are wired in later phases.
 */
export function MenuNode({ menu, depth }: MenuNodeProps) {
  const expandedNodes = useMenuStore((s) => s.expandedNodes);
  const toggleNode = useMenuStore((s) => s.toggleNode);
  const selectedNode = useMenuStore((s) => s.selectedNode);
  const setSelectedNode = useMenuStore((s) => s.setSelectedNode);
  const searchTerm = useMenuStore((s) => s.searchTerm);
  const openCreate = useUIStore((s) => s.openCreate);
  const openEdit = useUIStore((s) => s.openEdit);
  const openDelete = useUIStore((s) => s.openDelete);

  const hasChildren = menu.children.length > 0;
  // During an active search, force-expand so matching descendants stay visible.
  const isExpanded = expandedNodes.has(menu.id) || searchTerm.trim() !== "";
  const isSelected = selectedNode?.id === menu.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md py-1.5 pr-2 transition hover:bg-slate-50 ${
          isSelected ? "bg-brand/5" : ""
        }`}
        style={{ paddingLeft: `${depth * 20}px` }}
      >
        {/* Expand / collapse toggle (or spacer to keep alignment) */}
        {hasChildren ? (
          <button
            onClick={() => toggleNode(menu.id)}
            className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="h-5 w-5" />
        )}

        <button
          onClick={() => setSelectedNode(menu)}
          className={`flex-1 truncate text-left text-sm ${
            isSelected ? "font-medium text-brand" : "text-slate-700"
          }`}
        >
          {menu.title}
        </button>

        {/* Row actions — revealed on hover */}
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => openCreate(menu.id)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"
            aria-label="Add child menu"
            type="button"
            title="Add child"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={() => openEdit(menu)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="Edit menu"
            type="button"
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => openDelete(menu)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600"
            aria-label="Delete menu"
            type="button"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          {menu.children.map((child) => (
            <MenuNode key={child.id} menu={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
