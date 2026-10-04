import type { ReactNode } from "react";
import { Link } from "react-router";
import type { CartOut } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { formatBRL } from "@/lib/format";
import type { CartShippingChoice } from "../shipping-options";

interface CheckoutSummaryProps {
  cart: CartOut;
  shipping: CartShippingChoice | null;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
  error?: ReactNode;
}

export function CheckoutSummary({ cart, shipping, canSubmit, submitting, onSubmit, error }: CheckoutSummaryProps) {
  const subtotalCents = Math.round(Number(cart.total_price) * 100);
  const totalCents = subtotalCents + (shipping?.priceCents ?? 0);

  return (
    <aside aria-label="Resumo do pedido" className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Resumo do pedido</h2>

      <ul className="mt-4 divide-y divide-sand-200">
        {cart.items.map((item) => (
          <li key={item.cart_item_id} className="flex gap-3 py-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-sand">
              <ProductImage src={item.product.cover_image?.product_image_url} alt="" className="size-full" />
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{item.product.product_name}</p>
              <p className="text-ink-soft">Qtd. {item.quantity_item}</p>
            </div>
            <p className="text-sm font-semibold">{formatBRL(item.subtotal)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-2 space-y-2.5 border-t border-sand-200 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="font-medium">{formatBRL(subtotalCents / 100)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Frete</dt>
          <dd className="font-medium">{shipping ? formatBRL(shipping.priceCents / 100) : "A escolher"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-sand-200 pt-4">
        <span className="font-semibold">Total estimado</span>
        <span className="text-2xl font-semibold text-oxblood-700">{formatBRL(totalCents / 100)}</span>
      </div>
      <p className="mt-2 text-xs text-ink-soft">O valor final do pedido é confirmado na próxima etapa, antes do pagamento.</p>

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <Button size="lg" fullWidth className="mt-6" disabled={!canSubmit} loading={submitting} onClick={onSubmit}>
        Confirmar pedido
      </Button>
      <Link to="/carrinho" className="mt-3 block text-center text-sm font-semibold text-ink-soft hover:text-oxblood-700 hover:underline">
        Voltar ao carrinho
      </Link>
    </aside>
  );
}