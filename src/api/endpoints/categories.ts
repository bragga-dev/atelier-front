import { http } from "../http";
import type { CategoryPage } from "../types";

export interface ListCategoriesParams {
  page?: number;
  pageSize?: number;
  activeOnly?: boolean;
}

export const categoriesApi = {
  list: ({ page = 1, pageSize = 20, activeOnly = true }: ListCategoriesParams = {}, signal?: AbortSignal) =>
    http.get<CategoryPage>("/categories/", {
      signal,
      auth: false,
      query: { page, page_size: pageSize, active_only: activeOnly },
    }),
};
