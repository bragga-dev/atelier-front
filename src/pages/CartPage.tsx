import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useClearCart } from "@/features/cart/mutations";
import { useCart, useCartEnabled } from "@/features/cart/queries";

export default function CartPage() {
  const { me } = useAuth();
  const isClientAccount = useCartEnabled();
  const cart = useCart();
  const clearCart = useClearCart();
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (!isClientAccount) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ShoppingBag className="size-7" aria-hidden="true" />}
          title="Sem carrinho por aqui"
          description={
            me?.user.role === "admin"
              ? "Contas administrativas não fazem compras na loja."
              : "Entre com uma conta de cliente para usar o carrinho."
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold sm:text-5xl">Carrinho</h1>
        {cart.data && cart.data.items.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-soft hover:text-oxblood-700"
          >
            Esvaziar carrinho
          </button>
        )}
      </div>

      {cart.isPending ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <ul className="divide-y divide-sand-200">
            {Array.from({ length: 2 }, (_, i) => (
              <li key={i} className="flex gap-4 py-5">
                <Skeleton className="size-24 rounded-xl sm:size-28" />
                <div className="flex-1 space-y-3 py-1">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </li>
            ))}
          </ul>
          <Skeleton className="h-64 rounded-[var(--radius-card)]" />
        </div>
      ) : cart.isError ? (
        <ErrorState error={cart.error} onRetry={() => void cart.refetch()} retrying={cart.isFetching} />
      ) : !cart.data || cart.data.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-7" aria-hidden="true" />}
          title="Seu carrinho está vazio"
          description="Que tal dar uma olhada nas nossas peças?"
          action={
            <Link to="/produtos" className={buttonStyles()}>
              Ver produtos
            </Link>
          }
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <ul className="divide-y divide-sand-200 border-t border-sand-200 lg:border-t-0">
            {cart.data.items.map((item) => (
              <CartItemRow key={item.cart_item_id} item={item} />
            ))}
          </ul>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartSummary cart={cart.data} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingClear}
        title="Esvaziar o carrinho?"
        description="Todos os itens serão removidos. Essa ação não pode ser desfeita."
        confirmLabel="Esvaziar"
        confirmVariant="primary"
        loading={clearCart.isPending}
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() =>
          clearCart.mutate(undefined, {
            onSuccess: () => setConfirmingClear(false),
          })
        }
      />
    </Container>
  );
}