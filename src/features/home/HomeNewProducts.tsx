import { Container } from "@/components/layout/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductGrid, ProductGridSkeleton } from "@/features/catalog/components/ProductGrid";
import { useProducts } from "@/features/catalog/queries";
import { SectionHeading } from "./SectionHeading";

const COUNT = 8;

/** "Novidades": os produtos mais recentes (`sort=recent` da API). */
export function HomeNewProducts() {
  const products = useProducts({ page: 1, pageSize: COUNT, sort: "recent" });
  const items = products.data?.items ?? [];

  if (!products.isPending && !products.isError && items.length === 0) return null;

  return (
    <section aria-labelledby="home-novidades" className="py-8 sm:py-10">
      <Container>
        <div id="home-novidades">
          <SectionHeading title="Novidades" linkTo="/produtos?ordem=recentes" linkLabel="Ver todos" />
        </div>

        {products.isPending ? (
          <ProductGridSkeleton count={COUNT} />
        ) : products.isError ? (
          <ErrorState
            error={products.error}
            title="Não foi possível carregar as novidades"
            onRetry={() => void products.refetch()}
            retrying={products.isFetching}
            className="py-6"
          />
        ) : (
          <ProductGrid products={items} />
        )}
      </Container>
    </section>
  );
}