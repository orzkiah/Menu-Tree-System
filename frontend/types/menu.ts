// Core domain & API types shared across the frontend.

/** A menu node as returned by the backend tree endpoint. */
export interface Menu {
  id: string;
  title: string;
  slug: string;
  icon: string;
  parentId: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  children: Menu[];
}

/** Standard API response envelope used by the backend. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

/** Payload for creating a menu. */
export interface CreateMenuInput {
  title: string;
  slug?: string;
  icon?: string;
  parentId?: string | null;
  position?: number;
}

/** Payload for updating a menu. */
export type UpdateMenuInput = CreateMenuInput;
