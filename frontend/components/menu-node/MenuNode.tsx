"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { Menu } from "@/types/menu";
import { useMenuStore } from "@/stores/menu.store";

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
  const toggleExpand = useMenuStore((s) => s.toggleExpand);
  const selectedNode = useMenuStore((s) => s.selectedNode);
  const setSelectedNode = useMenuStore((s) => s.setSelectedNode);

  const hasChildren = menu.children.length > 0;
  const isExpanded = expandedNodes.has(menu.id);
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
            onClick={() => toggleExpand(menu.id)}
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

        {/* Add-child affordance (visual only this phase) */}
        <button
          className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white opacity-0 transition group-hover:opacity-100"
          aria-label="Add child menu"
          type="button"
        >
          <Plus className="h-3 w-3" />
        </button>
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
