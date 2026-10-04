import { Link } from "react-router";
import type { OrderOut } from "@/api/types";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { formatBRL, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "./StatusBadges";

export function OrderListItem({ order }: { order: OrderOut }) {
  const items = order.items ?? [];
  const preview = items.slice(0, 3);
  const extra = items.length - preview.length;

  return (
    <li>
      <Link
        to={`/painel/meus-pedidos/${order.order_id}`}
        className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 transition-shadow hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {preview.map((item) => (
              <div key={item.order_item_id} className="size-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-sand">
                <ProductImage src={item.product.cover_image?.product_image_url} alt="" className="size-full" />
              </div>
            ))}
            {extra > 0 && (
              <div className="grid size-14 shrink-0 place-items-center rounded-xl border-2 border-white bg-sand text-sm font-semibold text-ink-soft">
                +{extra}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold">Pedido {order.code}</p>
            <p className="text-sm text-ink-soft">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
          <OrderStatusBadge status={order.order_status} label={order.order_status_label} />
          <p className="text-lg font-semibold text-oxblood-700">{formatBRL(order.total_geral)}</p>
        </div>
      </Link>
    </li>
  );
}