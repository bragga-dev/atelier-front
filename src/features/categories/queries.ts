import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/api/endpoints/categories";
import { queryKeys } from "@/api/query-keys";

interface CategoriesParams {
  page?: number;
  /** O backend limita a 100 por página. */
  pageSize?: number;
  activeOnly?: boolean;
}

/** Opções compartilhadas entre `useQuery` e `queryClient.prefetchQuery`. */
export function categoriesQueryOptions({ page = 1, pageSize = 100, activeOnly = true }: CategoriesParams = {}) {
  return queryOptions({
    queryKey: queryKeys.categories.list({ page, pageSize, activeOnly }),
    queryFn: ({ signal }) => categoriesApi.list({ page, pageSize, activeOnly }, signal),
    // Categorias mudam pouco: cache longo e sem "piscar" ao trocar de página.
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useCategories({ enabled = true, ...params }: CategoriesParams & { enabled?: boolean } = {}) {
  return useQuery({ ...categoriesQueryOptions(params), enabled });
}
