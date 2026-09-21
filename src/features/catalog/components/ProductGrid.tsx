import type { ProductListOut } from "@/api/types";
import { cn } from "@/lib/cn";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

const GRID = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4";

export function ProductGrid({
  products,
  dimmed = false,
  className,
}: {
  products: ProductListOut[];
  /** Esmaece a lista enquanto a próxima página/filtro carrega. */
  dimmed?: boolean;
  className?: string;
}) {
  return (
    <ul
      className={cn(GRID, "transition-opacity", dimmed && "pointer-events-none opacity-50", className)}
      aria-busy={dimmed || undefined}
    >
      {products.map((product) => (
        <ProductCard key={product.product_id} product={product} />
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 12, className }: { count?: number; className?: string }) {
  return (
    <ul className={cn(GRID, className)} aria-busy="true" aria-label="Carregando produtos">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </ul>
  );
}