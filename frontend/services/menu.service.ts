import { api } from "@/lib/axios";
import type {
  ApiResponse,
  CreateMenuInput,
  Menu,
  UpdateMenuInput,
} from "@/types/menu";

/**
 * Thin API client for the menu endpoints. These functions only describe the
 * HTTP contract; they are wired into the UI (TanStack Query / mutations) in a
 * later phase.
 */
export const menuService = {
  async getTree(search?: string): Promise<Menu[]> {
    const { data } = await api.get<ApiResponse<Menu[]>>("/menus", {
      params: search ? { search } : undefined,
    });
    return data.data;
  },

  async getById(id: string): Promise<Menu> {
    const { data } = await api.get<ApiResponse<Menu>>(`/menus/${id}`);
    return data.data;
  },

  async create(input: CreateMenuInput): Promise<Menu> {
    const { data } = await api.post<ApiResponse<Menu>>("/menus", input);
    return data.data;
  },

  async update(id: string, input: UpdateMenuInput): Promise<Menu> {
    const { data } = await api.put<ApiResponse<Menu>>(`/menus/${id}`, input);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/menus/${id}`);
  },
};
