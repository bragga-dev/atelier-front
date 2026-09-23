import { Trash2 } from "lucide-react";
import { Link } from "react-router";
import type { CartItemOut } from "@/api/types";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Spinner } from "@/components/ui/Spinner";
import { useRemoveCartItem, useUpdateCartItem } from "@/features/cart/mutations";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { formatBRL } from "@/lib/format";
import { productPath } from "@/lib/slug";

export function CartItemRow({ item }: { item: CartItemOut }) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const outOfStock = !item.product.in_stock || item.product.stock <= 0;
  const removing = removeItem.isPending;

  return (
    <li className="flex gap-4 border-b border-sand-200 py-5 last:border-0">
      <Link to={productPath(item.product)} className="shrink-0">
        <ProductImage
          src={item.product.cover_image?.product_image_url}
          alt={item.product.product_name}
          className="size-24 rounded-md border border-sand-200 sm:size-28"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={productPath(item.product)} className="font-display text-lg font-semibold leading-tight hover:text-oxblood-700">
              {item.product.product_name}
            </Link>
            <p className="mt-1 text-sm text-ink-soft">{formatBRL(item.unit_price_item)} / un.</p>
          </div>

          <button
            type="button"
            onClick={() => removeItem.mutate(item.cart_item_id)}
            disabled={removing}
            aria-label={`Remover ${item.product.product_name} do carrinho`}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-oxblood-50 hover:text-oxblood-700 disabled:opacity-50"
          >
            {removing ? <Spinner className="size-4" /> : <Trash2 className="size-4" aria-hidden="true" />}
          </button>
        </div>

        {outOfStock ? (
          <p className="text-sm font-medium text-oxblood-600">Produto esgotado — remova para continuar a compra.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <QuantitySelector
              value={item.quantity_item}
              max={item.product.stock}
              disabled={updateItem.isPending || removing}
              onChange={(next) => updateItem.mutate({ cartItemId: item.cart_item_id, quantityItem: next })}
            />
            <p className="font-semibold text-ink">{formatBRL(item.subtotal)}</p>
          </div>
        )}
      </div>
    </li>
  );
}