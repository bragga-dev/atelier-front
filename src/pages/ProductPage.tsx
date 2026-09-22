import { useEffect } from "react";
import { PackageX } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGallery } from "@/features/catalog/components/ProductGallery";
import { RelatedProducts } from "@/features/catalog/components/RelatedProducts";
import { useProduct } from "@/features/catalog/queries";
import { BuyBox } from "@/features/product/components/BuyBox";
import { ReviewsSection } from "@/features/reviews/components/ReviewsSection";
import { isApiError } from "@/api/errors";
import { productPath } from "@/lib/slug";

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const product = useProduct(productId ?? "");
  const data = product.data;
  const category = data?.categories[0];

  // Mantém a URL sempre com o slug atual do produto (compartilhável e legível), sem quebrar quem
  // chegou com um link antigo — a navegação troca de URL sem entrar no histórico.
  useEffect(() => {
    if (!data) return;
    const canonical = productPath(data);
    if (location.pathname !== canonical) navigate(`${canonical}${location.search}`, { replace: true });
  }, [data, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (data) document.title = `${data.product_name} — Sol e Arte`;
  }, [data]);

  if (product.isPending) {
    return (
      <Container className="py-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-[var(--radius-card)]" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Container>
    );
  }

  if (product.isError) {
    if (isApiError(product.error) && product.error.status === 404) {
      return (
        <Container className="py-16">
          <EmptyState
            icon={<PackageX className="size-7" aria-hidden="true" />}
            title="Produto não encontrado"
            description="Esse produto pode ter sido removido ou o link está incorreto."
            action={
              <Link to="/produtos" className={buttonStyles({ variant: "outline" })}>
                Ver todos os produtos
              </Link>
            }
          />
        </Container>
      );
    }
    return (
      <Container className="py-16">
        <ErrorState error={product.error} onRetry={() => void product.refetch()} retrying={product.isFetching} />
      </Container>
    );
  }

  if (!data) return null;

  return (
    <>
      <Container className="py-6 sm:py-10">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: "Início", to: "/" },
            ...(category ? [{ label: category.category_name, to: `/produtos?categoria=${category.product_category_id}` }] : []),
            { label: data.product_name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={data.images} productName={data.product_name} />

          <div>
            {category && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">{category.category_name}</p>
            )}
            <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{data.product_name}</h1>

            <div className="mt-6">
              <BuyBox product={data} />
            </div>

            {data.description && (
              <div className="mt-8 border-t border-sand-200 pt-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">Descrição</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{data.description}</p>
              </div>
            )}
          </div>
        </div>
      </Container>

      <ReviewsSection productId={data.product_id} />

      {category && (
        <RelatedProducts
          categoryId={category.product_category_id}
          categoryName={category.category_name}
          excludeProductId={data.product_id}
        />
      )}
    </>
  );
}