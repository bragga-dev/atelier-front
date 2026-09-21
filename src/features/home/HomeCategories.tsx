import { Container } from "@/components/layout/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CategoryTile } from "@/features/categories/CategoryTile";
import { useCategories } from "@/features/categories/queries";
import { SectionHeading } from "./SectionHeading";

const COUNT = 8;

export function HomeCategories() {
  const categories = useCategories({ pageSize: COUNT });
  const items = categories.data?.items ?? [];

  // Sem categorias cadastradas: a seção simplesmente não aparece (home enxuta).
  if (!categories.isPending && !categories.isError && items.length === 0) return null;

  return (
    <section aria-labelledby="home-categorias" className="py-8 sm:py-10">
      <Container>
        <div id="home-categorias">
          <SectionHeading title="Categorias" linkTo="/categorias" linkLabel="Ver todas" />
        </div>

        {categories.isPending ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4" aria-busy="true" aria-label="Carregando categorias">
            {Array.from({ length: COUNT }, (_, i) => (
              <li key={i}>
                <Skeleton className="aspect-[4/3]" />
              </li>
            ))}
          </ul>
        ) : categories.isError ? (
          <ErrorState
            error={categories.error}
            title="Não foi possível carregar as categorias"
            onRetry={() => void categories.refetch()}
            retrying={categories.isFetching}
            className="py-6"
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {items.map((category) => (
              <CategoryTile key={category.product_category_id} category={category} />
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}