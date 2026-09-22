import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/features/home/SectionHeading";
import { useProducts } from "@/features/catalog/queries";
import { ProductGrid, ProductGridSkeleton } from "./ProductGrid";

const COUNT = 4;

/** "Mais desta categoria": reaproveita o filtro por categoria do catálogo, excluindo o produto atual. */
export function RelatedProducts({ categoryId, categoryName, excludeProductId }: { categoryId: string; categoryName: string; excludeProductId: string }) {
  const products = useProducts({ categoryId, pageSize: COUNT + 1, inStockOnly: true });
  const items = (products.data?.items ?? []).filter((product) => product.product_id !== excludeProductId).slice(0, COUNT);

  if (!products.isPending && items.length === 0) return null;

  return (
    <section aria-labelledby="mais-desta-categoria" className="py-10">
      <Container>
        <div id="mais-desta-categoria">
          <SectionHeading title={`Mais em ${categoryName}`} linkTo={`/produtos?categoria=${categoryId}`} linkLabel="Ver todos" />
        </div>
        {products.isPending ? <ProductGridSkeleton count={COUNT} /> : <ProductGrid products={items} />}
      </Container>
    </section>
  );
}