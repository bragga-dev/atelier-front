import { useCallback, useEffect, useMemo } from "react";
import { PackageSearch, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { CatalogFiltersBar } from "@/features/catalog/components/CatalogFiltersBar";
import { ProductGrid, ProductGridSkeleton } from "@/features/catalog/components/ProductGrid";
import {
  CATALOG_PAGE_SIZE,
  hasActiveFilters,
  readCatalogFilters,
  toCatalogSearchParams,
  type CatalogFilters,
} from "@/features/catalog/catalog-params";
import { productsQueryOptions, useProducts } from "@/features/catalog/queries";
import { useCategories } from "@/features/categories/queries";

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover filtro: ${label}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-1 text-sm hover:border-oxblood-600"
      >
        {label}
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const filters = useMemo(() => readCatalogFilters(searchParams), [searchParams]);

  const productParams = useMemo(
    () => ({
      page: filters.page,
      pageSize: CATALOG_PAGE_SIZE,
      search: filters.search || undefined,
      categoryId: filters.categoryId ?? undefined,
      inStockOnly: filters.inStockOnly,
      sort: filters.sort === "recent" ? ("recent" as const) : undefined,
    }),
    [filters],
  );

  const products = useProducts(productParams);
  const categories = useCategories({ pageSize: 100 });

  /** Muda filtros (volta para a página 1). `replace` evita poluir o histórico a cada tecla/seleção. */
  const updateFilters = useCallback(
    (changes: Partial<Omit<CatalogFilters, "page">>) => {
      setSearchParams((current) => toCatalogSearchParams({ ...readCatalogFilters(current), ...changes, page: 1 }), {
        replace: true,
        preventScrollReset: true,
      });
    },
    [setSearchParams],
  );

  const buildPageHref = useCallback(
    (page: number) => {
      const query = toCatalogSearchParams({ ...filters, page }).toString();
      return query ? `?${query}` : "?";
    },
    [filters],
  );

  const data = products.data;

  // Adianta a próxima página enquanto a pessoa lê a atual.
  useEffect(() => {
    if (data && data.page < data.pages) {
      void queryClient.prefetchQuery(productsQueryOptions({ ...productParams, page: data.page + 1 }));
    }
  }, [data, productParams, queryClient]);

  // URL com página além do fim (ex.: link antigo): volta para a primeira.
  const beyondLastPage = Boolean(data && data.items.length === 0 && data.total > 0 && filters.page > 1);
  useEffect(() => {
    if (beyondLastPage) {
      setSearchParams(toCatalogSearchParams({ ...filters, page: 1 }), { replace: true });
    }
  }, [beyondLastPage, filters, setSearchParams]);

  const categoryName = categories.data?.items.find(
    (category) => category.product_category_id === filters.categoryId,
  )?.category_name;

  const clearAll = () => setSearchParams(new URLSearchParams(), { replace: true, preventScrollReset: true });

  const isRefetching = products.isFetching && !products.isPending;
  const active = hasActiveFilters(filters);

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold sm:text-5xl">{categoryName ?? "Produtos"}</h1>
        <p className="mt-2 text-ink-soft" aria-live="polite">
          {data ? `${data.total} ${data.total === 1 ? "produto encontrado" : "produtos encontrados"}` : "\u00a0"}
        </p>
      </header>

      <CatalogFiltersBar
        filters={filters}
        categories={categories.data?.items ?? []}
        categoriesLoading={categories.isPending}
        onChange={updateFilters}
      />

      {active && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ul className="flex flex-wrap gap-2" aria-label="Filtros ativos">
            {filters.search && <FilterChip label={`Busca: ${filters.search}`} onRemove={() => updateFilters({ search: "" })} />}
            {filters.categoryId && (
              <FilterChip label={categoryName ?? "Categoria"} onRemove={() => updateFilters({ categoryId: null })} />
            )}
            {filters.inStockOnly && (
              <FilterChip label="Somente disponíveis" onRemove={() => updateFilters({ inStockOnly: false })} />
            )}
          </ul>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Limpar filtros
          </Button>
        </div>
      )}

      <section aria-label="Resultados" className="mt-8">
        {products.isPending ? (
          <ProductGridSkeleton count={CATALOG_PAGE_SIZE} />
        ) : products.isError && !data ? (
          <ErrorState
            error={products.error}
            title="Não foi possível carregar os produtos"
            onRetry={() => void products.refetch()}
            retrying={products.isFetching}
          />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="size-7" aria-hidden="true" />}
            title={active ? "Nenhum produto encontrado" : "Ainda não há produtos por aqui"}
            description={
              active ? "Tente outra busca ou remova alguns filtros." : "Volte em breve — estamos preparando novidades."
            }
            action={
              active ? (
                <Button variant="outline" onClick={clearAll}>
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        ) : data ? (
          <>
            {products.isError && (
              <p role="alert" className="mb-4 rounded-md bg-oxblood-50 px-4 py-3 text-sm text-oxblood-700">
                Não foi possível atualizar a lista.{" "}
                <button type="button" className="font-semibold underline" onClick={() => void products.refetch()}>
                  Tentar novamente
                </button>
              </p>
            )}
            <ProductGrid products={data.items} dimmed={isRefetching} />
            <Pagination className="mt-10" page={data.page} pages={data.pages} buildHref={buildPageHref} />
          </>
        ) : null}
      </section>
    </Container>
  );
}