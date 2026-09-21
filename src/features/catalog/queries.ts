import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { productsApi, type ListProductsParams } from "@/api/endpoints/products";
import { queryKeys } from "@/api/query-keys";

/** Opções compartilhadas entre `useQuery` e `prefetchQuery` (próxima página). */
export function productsQueryOptions(params: ListProductsParams) {
  return queryOptions({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal),
    staleTime: 60_000,
    // Ao trocar de página/filtro, mantém a lista anterior na tela (esmaecida) até a nova chegar.
    placeholderData: keepPreviousData,
  });
}

export function useProducts(params: ListProductsParams) {
  return useQuery(productsQueryOptions(params));
}