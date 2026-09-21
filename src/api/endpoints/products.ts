import { http } from "../http";
import type { ProductPage } from "../types";

export interface ListProductsParams {
  page?: number;
  /** O backend limita a 100 por página. */
  pageSize?: number;
  /** Busca por nome do produto ou nome da categoria (o backend não busca na descrição). */
  search?: string;
  categoryId?: string;
  inStockOnly?: boolean;
  /** `recent` = mais novos primeiro; sem valor = ordem alfabética (padrão do backend). */
  sort?: "recent";
}

export const productsApi = {
  list: (params: ListProductsParams = {}, signal?: AbortSignal) =>
    http.get<ProductPage>("/products/", {
      signal,
      auth: false,
      query: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 12,
        search: params.search,
        product_category_id: params.categoryId,
        in_stock_only: params.inStockOnly ? true : undefined,
        sort: params.sort,
      },
    }),
};