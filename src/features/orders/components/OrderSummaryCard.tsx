import type { OrderOut } from "@/api/types";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { formatBRL } from "@/lib/format";
import { productPath } from "@/lib/slug";
import { Link } from "react-router";

/** Itens e totais de um pedido — sempre os valores que o backend gravou (fonte de verdade). */
export function OrderSummaryCard({ order }: { order: OrderOut }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Resumo do pedido</h2>

      <ul className="mt-4 divide-y divide-sand-200">
        {(order.items ?? []).map((item) => (
          <li key={item.order_item_id} className="flex gap-3 py-3">
            <Link to={productPath(item.product)} className="size-14 shrink-0 overflow-hidden rounded-lg bg-sand">
              <ProductImage src={item.product.cover_image?.product_image_url} alt={item.product.product_name} className="size-full" />
            </Link>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{item.product.product_name}</p>
              <p className="text-ink-soft">
                {item.order_item_quantity} × {formatBRL(item.order_item_price)}
              </p>
            </div>
            <p className="text-sm font-semibold">{formatBRL(item.subtotal)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-2 space-y-2.5 border-t border-sand-200 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="font-medium">{formatBRL(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Frete</dt>
          <dd className="font-medium">{formatBRL(order.order_shipping_total)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-sand-200 pt-4">
        <span className="font-semibold">Total</span>
        <span className="text-2xl font-semibold text-oxblood-700">{formatBRL(order.total_geral)}</span>
      </div>
    </div>
  );
}