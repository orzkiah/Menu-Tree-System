import type { Menu } from "@/types/menu";

// Static tree mirroring the Figma reference so the UI renders realistically
// before the API is wired up (Phase 9 replaces this with a live fetch).

let seq = 0;
const node = (title: string, children: Menu[] = []): Menu => {
  const id = `mock-${++seq}`;
  return {
    id,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    icon: "",
    parentId: null,
    position: 0,
    createdAt: "",
    updatedAt: "",
    children,
  };
};

// Fix up parentId/position references after construction.
const linked = (menus: Menu[], parentId: string | null = null): Menu[] =>
  menus.map((m, i) => ({
    ...m,
    parentId,
    position: i,
    children: linked(m.children, m.id),
  }));

export const MOCK_MENUS: Menu[] = linked([
  node("system management", [
    node("Systems", [
      node("System Code", [node("Code Registration")]),
      node("Code Registration - 2"),
      node("Properties"),
      node("Menus", [node("Menu Registration")]),
      node("API List", [node("API Registration"), node("API Edit")]),
    ]),
    node("Users & Groups", [
      node("Users", [node("User Account Registration")]),
      node("Groups", [node("User Group Registration")]),
    ]),
    node("사용자 승인", [node("사용자 승인 상세")]),
  ]),
]);
