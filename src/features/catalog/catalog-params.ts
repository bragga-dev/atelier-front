/**
 * O estado do catálogo mora na URL (compartilhável, funciona com o botão voltar):
 *   /produtos?busca=croche&categoria=<uuid>&disponiveis=1&ordem=recentes&pagina=2
 * Valores padrão não aparecem na URL.
 */
export const CATALOG_PAGE_SIZE = 12;

export type CatalogSort = "alpha" | "recent";

export interface CatalogFilters {
  search: string;
  categoryId: string | null;
  inStockOnly: boolean;
  sort: CatalogSort;
  page: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const category = params.get("categoria");
  const page = Number.parseInt(params.get("pagina") ?? "", 10);

  return {
    search: (params.get("busca") ?? "").trim(),
    // Um UUID inválido faria o backend responder 422 — ignoramos.
    categoryId: category && UUID_PATTERN.test(category) ? category : null,
    inStockOnly: params.get("disponiveis") === "1",
    sort: params.get("ordem") === "recentes" ? "recent" : "alpha",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function toCatalogSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("busca", filters.search);
  if (filters.categoryId) params.set("categoria", filters.categoryId);
  if (filters.inStockOnly) params.set("disponiveis", "1");
  if (filters.sort === "recent") params.set("ordem", "recentes");
  if (filters.page > 1) params.set("pagina", String(filters.page));
  return params;
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return Boolean(filters.search || filters.categoryId || filters.inStockOnly);
}