import { Link } from "react-router";
import type { CartOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { formatBRL } from "@/lib/format";

export function CartSummary({ cart }: { cart: CartOut }) {
  const noShippingYet = Number(cart.total_shipping) === 0;

  return (
    <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Resumo</h2>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="font-medium">{formatBRL(cart.total_price)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Frete</dt>
          <dd className="font-medium">{formatBRL(cart.total_shipping)}</dd>
        </div>
      </dl>

      {noShippingYet && <p className="mt-2 text-xs text-ink-soft">O frete é calculado no checkout.</p>}

      <div className="mt-4 flex items-baseline justify-between border-t border-sand-200 pt-4">
        <span className="font-semibold">Total</span>
        <span className="text-2xl font-semibold text-oxblood-700">{formatBRL(cart.total_geral)}</span>
      </div>

      <Link to="/checkout" className="mt-6 block">
        <Button size="lg" fullWidth>
          Continuar para o checkout
        </Button>
      </Link>
    </div>
  );
}