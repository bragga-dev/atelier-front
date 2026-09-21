import { Link } from "react-router";
import type { ProductListOut } from "@/api/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/format";
import { productPath } from "@/lib/slug";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: ProductListOut }) {
  const category = product.categories[0]?.category_name;

  return (
    <li>
      <Link
        to={productPath(product)}
        className="group flex h-full flex-col overflow-hidden rounded-md border border-sand-200 bg-white transition-shadow hover:shadow-card"
      >
        <div className="relative aspect-square overflow-hidden bg-sand">
          <ProductImage
            src={product.cover_image?.product_image_url}
            alt={product.product_name}
            className="size-full transition-transform duration-500 group-hover:scale-105"
          />
          {!product.in_stock && (
            <span className="absolute left-3 top-3 rounded bg-espresso px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-cream">
              Esgotado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          {category && (
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">{category}</p>
          )}
          <h3 className="font-display text-xl font-semibold leading-tight">{product.product_name}</h3>
          <p className="mt-auto pt-3 text-lg font-semibold text-oxblood-700">{formatBRL(product.price)}</p>
        </div>
      </Link>
    </li>
  );
}

export function ProductCardSkeleton() {
  return (
    <li aria-hidden="true" className="overflow-hidden rounded-md border border-sand-200 bg-white">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="mt-3 h-5 w-1/3" />
      </div>
    </li>
  );
}