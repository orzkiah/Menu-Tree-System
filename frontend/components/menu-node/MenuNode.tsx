"use client";

import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { Menu } from "@/types/menu";
import { useMenuStore } from "@/stores/menu.store";
import { useUIStore } from "@/stores/ui.store";

interface MenuNodeProps {
  menu: Menu;
  /**
   * One entry per ancestor level. `guides[k]` is true when the line for that
   * level should continue past this row (the ancestor we descended into still
   * has a younger sibling). The last entry is the connector to this node, so
   * `guides[guides.length - 1]` is true when this node has a younger sibling.
   * Root nodes receive an empty array (no connector lines).
   */
  guides: boolean[];
}

/**
 * A single tree row with parent→child connector lines (├ / └ / │), rendered
 * recursively for unlimited nesting. Expand/collapse, selection and the
 * add/edit/delete actions are driven by the stores.
 */
export function MenuNode({ menu, guides }: MenuNodeProps) {
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
  const depth = guides.length;

  return (
    <div>
      <div
        className={`group flex items-stretch rounded-md transition hover:bg-slate-50 ${
          isSelected ? "bg-brand/5" : ""
        }`}
      >
        {/* Connector lines — one 20px column per ancestor level */}
        {guides.map((continues, k) => {
          const isConnector = k === depth - 1;
          return (
            <span key={k} className="relative w-5 shrink-0 self-stretch">
              {isConnector ? (
                <>
                  {/* vertical: top half always, bottom half if the node continues */}
                  <span className="absolute left-1/2 top-0 h-1/2 w-px -translate-x-1/2 bg-slate-300" />
                  {continues && (
                    <span className="absolute left-1/2 top-1/2 h-1/2 w-px -translate-x-1/2 bg-slate-300" />
                  )}
                  {/* horizontal tick into the row */}
                  <span className="absolute left-1/2 right-0 top-1/2 h-px -translate-y-1/2 bg-slate-300" />
                </>
              ) : (
                continues && (
                  <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-300" />
                )
              )}
            </span>
          );
        })}

        {/* Row content */}
        <div className="flex flex-1 items-center gap-1 py-1.5 pr-2">
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
      </div>

      {hasChildren && isExpanded && (
        <div>
          {menu.children.map((child, i) => (
            <MenuNode
              key={child.id}
              menu={child}
              guides={[...guides, i < menu.children.length - 1]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
