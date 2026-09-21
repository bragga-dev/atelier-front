import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { categoriesQueryOptions, useCategories } from "@/features/categories/queries";
import { useDismissable } from "@/hooks/use-dismissable";
import { cn } from "@/lib/cn";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CategoryThumb } from "./CategoryThumb";
import { Container } from "./Container";

const PANEL_ID = "menu-categorias";

/** Menu "Categorias" (desktop): painel largo sob o header, alimentado pela API. */
export function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const queryClient = useQueryClient();

  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef);

  // Fecha ao navegar (clicou numa categoria).
  useEffect(() => {
    close();
  }, [location.pathname, location.search, close]);

  // Só busca quando o painel abre; ao passar o mouse/focar, adianta a requisição.
  const categories = useCategories({ enabled: open });
  const prefetch = () => void queryClient.prefetchQuery(categoriesQueryOptions());

  return (
    <div ref={containerRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((current) => !current)}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        className={cn(
          "inline-flex h-11 items-center gap-1.5 px-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-oxblood-700",
          open && "text-oxblood-700",
        )}
      >
        Categorias
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div id={PANEL_ID} className="absolute inset-x-0 top-full border-b border-sand-200 bg-cream shadow-card">
          <Container className="py-6">
            <CategoriesPanelContent
              isPending={categories.isPending}
              isError={categories.isError}
              error={categories.error}
              isFetching={categories.isFetching}
              refetch={() => void categories.refetch()}
              items={categories.data?.items ?? []}
            />
          </Container>
        </div>
      )}
    </div>
  );
}

interface PanelContentProps {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isFetching: boolean;
  refetch: () => void;
  items: { product_category_id: string; category_name: string; category_image_url: string }[];
}

function CategoriesPanelContent({ isPending, isError, error, isFetching, refetch, items }: PanelContentProps) {
  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-busy="true" aria-label="Carregando categorias">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState className="py-4" error={error} onRetry={refetch} retrying={isFetching} title="Não foi possível carregar as categorias" />;
  }

  if (items.length === 0) {
    return <p className="py-4 text-center text-ink-soft">Nenhuma categoria disponível no momento.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-3 xl:grid-cols-5">
        {items.map((category) => (
          <li key={category.product_category_id}>
            <Link
              to={`/produtos?categoria=${category.product_category_id}`}
              className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-espresso/5"
            >
              <CategoryThumb src={category.category_image_url} />
              <span className="font-medium">{category.category_name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-sand-200 pt-4">
        <Link to="/categorias" className="text-sm font-semibold uppercase tracking-[0.12em] text-oxblood-700 hover:underline">
          Ver todas as categorias
        </Link>
      </div>
    </>
  );
}
