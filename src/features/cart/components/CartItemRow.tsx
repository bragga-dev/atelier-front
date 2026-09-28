import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Link } from "react-router";
import type { CartItemOut } from "@/api/types";
import { toUserMessage } from "@/api/errors";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Spinner } from "@/components/ui/Spinner";
import { formatBRL } from "@/lib/format";
import { productPath } from "@/lib/slug";
import { useRemoveCartItem, useUpdateCartItemQuantity } from "../mutations";
import { ProductImage } from "@/features/catalog/components/ProductImage";

const QUANTITY_DEBOUNCE_MS = 500;

export function CartItemRow({ item }: { item: CartItemOut }) {
  const [quantity, setQuantity] = useState(item.quantity_item);
  const pushedQuantity = useRef(item.quantity_item);
  const updateQuantity = useUpdateCartItemQuantity();
  const removeItem = useRemoveCartItem();

  // A quantidade muda "por fora" quando a mutação conclui (ou outra aba/mudança externa) —
  // reflete no seletor sem disparar uma nova chamada.
  useEffect(() => {
    if (item.quantity_item !== pushedQuantity.current) {
      pushedQuantity.current = item.quantity_item;
      setQuantity(item.quantity_item);
    }
  }, [item.quantity_item]);

  useEffect(() => {
    if (quantity === pushedQuantity.current) return;
    const timer = window.setTimeout(() => {
      pushedQuantity.current = quantity;
      updateQuantity.mutate({ cartItemId: item.cart_item_id, quantity });
    }, QUANTITY_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, item.cart_item_id]);

  // Erro (ex.: estoque insuficiente): desfaz a mudança local e mostra o motivo nesta linha.
  useEffect(() => {
    if (updateQuantity.isError) {
      pushedQuantity.current = item.quantity_item;
      setQuantity(item.quantity_item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateQuantity.isError]);

  const removing = removeItem.isPending && removeItem.variables === item.cart_item_id;

  return (
    <li className={removing ? "pointer-events-none opacity-50" : undefined}>
      <div className="flex gap-4 py-5">
        <Link to={productPath(item.product)} className="size-24 shrink-0 overflow-hidden rounded-xl bg-sand sm:size-28">
          <ProductImage src={item.product.cover_image?.product_image_url} alt={item.product.product_name} className="size-full" />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <Link to={productPath(item.product)} className="font-display text-lg font-semibold leading-tight hover:underline sm:text-xl">
              {item.product.product_name}
            </Link>
            <button
              type="button"
              onClick={() => removeItem.mutate(item.cart_item_id)}
              disabled={removing}
              aria-label={`Remover ${item.product.product_name} do carrinho`}
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-oxblood-50 hover:text-oxblood-700"
            >
              {removing ? <Spinner className="size-4" /> : <Trash2 className="size-5" aria-hidden="true" />}
            </button>
          </div>

          <p className="mt-1 text-sm text-ink-soft">{formatBRL(item.unit_price_item)} / unidade</p>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={item.product.stock}
              disabled={removing}
            />
            <p className="text-lg font-semibold text-oxblood-700">{formatBRL(item.subtotal)}</p>
          </div>

          {updateQuantity.isError && (
            <p role="alert" className="mt-2 text-sm font-medium text-oxblood-700">
              {toUserMessage(updateQuantity.error, "Não foi possível atualizar a quantidade.")}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}