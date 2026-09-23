import { ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useCart } from "@/features/cart/queries";

function CartSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <ul>
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-4 border-b border-sand-200 py-5 last:border-0">
            <Skeleton className="size-24 shrink-0 sm:size-28" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-9 w-32" />
            </div>
          </li>
        ))}
      </ul>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function CartPage() {
  const { me } = useAuth();
  const isClientAccount = me?.user.role === "client";
  const cart = useCart();

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Carrinho</h1>

      <div className="mt-8">
        {!isClientAccount ? (
          <EmptyState
            icon={<ShoppingCart className="size-7" aria-hidden="true" />}
            title="Conta administrativa"
            description="Esta conta é administrativa e não faz compras na loja."
          />
        ) : cart.isPending ? (
          <CartSkeleton />
        ) : cart.isError ? (
          <ErrorState error={cart.error} onRetry={() => void cart.refetch()} retrying={cart.isFetching} />
        ) : cart.data.items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="size-7" aria-hidden="true" />}
            title="Seu carrinho está vazio"
            description="Explore o catálogo e adicione peças feitas à mão."
            action={
              <Link to="/produtos" className={buttonStyles({ variant: "outline" })}>
                Ver produtos
              </Link>
            }
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <ul>
              {cart.data.items.map((item) => (
                <CartItemRow key={item.cart_item_id} item={item} />
              ))}
            </ul>
            <CartSummary cart={cart.data} />
          </div>
        )}
      </div>
    </Container>
  );
}