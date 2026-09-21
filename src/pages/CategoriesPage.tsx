import { useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { LayoutGrid } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { CategoryOut } from "@/api/types";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { CategoryTile } from "@/features/categories/CategoryTile";
import { categoriesQueryOptions, useCategories } from "@/features/categories/queries";
import { buttonStyles } from "@/components/ui/button-styles";

const PAGE_SIZE = 24;

function readPage(params: URLSearchParams): number {
  const page = Number.parseInt(params.get("pagina") ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default function CategoriesPage() {
  const [searchParams] = useSearchParams();
  const page = readPage(searchParams);
  const queryClient = useQueryClient();
  const categories = useCategories({ page, pageSize: PAGE_SIZE });
  const data = categories.data;

  const buildHref = useCallback((target: number) => (target > 1 ? `?pagina=${target}` : "?"), []);

  useEffect(() => {
    if (data && data.page < data.pages) {
      void queryClient.prefetchQuery(categoriesQueryOptions({ page: data.page + 1, pageSize: PAGE_SIZE }));
    }
  }, [data, queryClient]);

  const items: CategoryOut[] = data?.items ?? [];

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold sm:text-5xl">Categorias</h1>
        <p className="mt-2 text-ink-soft">Explore as peças por tipo de artesanato.</p>
      </header>

      {categories.isPending ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Carregando categorias">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <Skeleton className="aspect-[4/3]" />
            </li>
          ))}
        </ul>
      ) : categories.isError && !data ? (
        <ErrorState
          error={categories.error}
          title="Não foi possível carregar as categorias"
          onRetry={() => void categories.refetch()}
          retrying={categories.isFetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-7" aria-hidden="true" />}
          title="Nenhuma categoria por aqui ainda"
          description="Enquanto isso, veja todos os produtos."
          action={
            <Link to="/produtos" className={buttonStyles({ variant: "outline" })}>
              Ver produtos
            </Link>
          }
        />
      ) : (
        <>
          <ul
            className={`grid grid-cols-2 gap-3 transition-opacity sm:gap-5 md:grid-cols-3 xl:grid-cols-4 ${
              categories.isFetching ? "opacity-50" : ""
            }`}
          >
            {items.map((category) => (
              <CategoryTile key={category.product_category_id} category={category} />
            ))}
          </ul>
          {data && <Pagination className="mt-10" page={data.page} pages={data.pages} buildHref={buildHref} />}
        </>
      )}
    </Container>
  );
}