"use client";

import {
  Boxes,
  Code2,
  Grid2x2,
  LayoutGrid,
  ListTree,
  Settings2,
  Users,
} from "lucide-react";
import { useState } from "react";

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

const ITEMS: SidebarItem[] = [
  { label: "Systems", icon: <LayoutGrid className="h-4 w-4" /> },
  { label: "System Code", icon: <Code2 className="h-4 w-4" /> },
  { label: "Properties", icon: <Settings2 className="h-4 w-4" /> },
  { label: "Menus", icon: <ListTree className="h-4 w-4" />, active: true },
  { label: "API List", icon: <Grid2x2 className="h-4 w-4" /> },
  { label: "Users & Group", icon: <Users className="h-4 w-4" /> },
  { label: "Competition", icon: <Boxes className="h-4 w-4" /> },
];

/** Dark navigation rail mirroring the Figma reference. */
export function Sidebar() {
  const [active, setActive] = useState("Menus");

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 rounded-2xl bg-sidebar p-4 text-slate-300 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <Grid2x2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">Orizkiah</span>
      </div>

      <nav className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const isActive = active === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActive(item.label)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-brand text-white"
                  : "text-slate-300 hover:bg-sidebar-accent"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
