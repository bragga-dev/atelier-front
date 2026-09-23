import { useState } from "react";
import { Link } from "react-router";
import type { CartOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { useClearCart } from "@/features/cart/mutations";
import { formatBRL } from "@/lib/format";

export function CartSummary({ cart }: { cart: CartOut }) {
  const clearCart = useClearCart();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const hasShipping = Number(cart.total_shipping) > 0;
  const hasOutOfStockItem = cart.items.some((item) => !item.product.in_stock || item.product.stock <= 0);

  return (
    <aside className="h-fit rounded-md border border-sand-200 bg-white p-6">
      <h2 className="font-display text-xl font-semibold">Resumo</h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="font-medium">{formatBRL(cart.total_price)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-soft">Frete</dt>
          <dd className="font-medium">{hasShipping ? formatBRL(cart.total_shipping) : "Calculado no checkout"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-4">
        <p className="text-base font-semibold">Total</p>
        <p className="text-2xl font-semibold text-oxblood-700">{formatBRL(cart.total_geral)}</p>
      </div>

      <Link to="/checkout" className="mt-6 block">
        <Button size="lg" fullWidth disabled={hasOutOfStockItem}>
          Finalizar compra
        </Button>
      </Link>
      {hasOutOfStockItem && (
        <p className="mt-2 text-center text-xs text-oxblood-600">Remova os itens esgotados para continuar.</p>
      )}

      <Button
        variant="ghost"
        size="sm"
        fullWidth
        className="mt-3"
        loading={clearCart.isPending}
        onClick={() => {
          if (!confirmingClear) {
            setConfirmingClear(true);
            return;
          }
          clearCart.mutate();
          setConfirmingClear(false);
        }}
        onBlur={() => setConfirmingClear(false)}
      >
        {confirmingClear ? "Confirmar: esvaziar carrinho?" : "Esvaziar carrinho"}
      </Button>
    </aside>
  );
}