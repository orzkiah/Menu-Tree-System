import type { Menu } from "@/types/menu";

/** Collects every node id in the tree (used by "Expand All"). */
export function collectIds(menus: Menu[]): string[] {
  const ids: string[] = [];
  const walk = (nodes: Menu[]) => {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(menus);
  return ids;
}

/** Returns the 1-based depth of a node id within the tree, or 0 if not found. */
export function depthOfId(menus: Menu[], id: string, depth = 1): number {
  for (const node of menus) {
    if (node.id === id) return depth;
    if (node.children?.length) {
      const found = depthOfId(node.children, id, depth + 1);
      if (found) return found;
    }
  }
  return 0;
}

/** Computes the maximum depth of the tree (1-based; 0 for an empty tree). */
export function maxDepth(menus: Menu[], depth = 1): number {
  let max = menus.length ? depth : 0;
  for (const node of menus) {
    if (node.children?.length) {
      max = Math.max(max, maxDepth(node.children, depth + 1));
    }
  }
  return max;
}
