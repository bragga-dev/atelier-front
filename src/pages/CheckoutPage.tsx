import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toUserMessage } from "@/api/errors";
import type { AddressOut } from "@/api/types";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { AddressPicker } from "@/features/address/components/AddressPicker";
import { useCart } from "@/features/cart/queries";
import { useCreateOrder } from "@/features/orders/mutations";
import { formatBRL } from "@/lib/format";

export default function CheckoutPage() {
  const { me } = useAuth();
  const isClientAccount = me?.user.role === "client";
  const cart = useCart();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState<AddressOut | null>(null);

  const handleConfirm = () => {
    if (!selectedAddress) return;
    createOrder.mutate(
      { shipping_address_id: selectedAddress.address_id },
      { onSuccess: (order) => navigate(`/painel/meus-pedidos/${order.order_id}`, { replace: true }) },
    );
  };

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Finalizar compra</h1>

      <div className="mt-8">
        {!isClientAccount ? (
          <EmptyState
            icon={<ShoppingCart className="size-7" aria-hidden="true" />}
            title="Conta administrativa"
            description="Esta conta é administrativa e não faz compras na loja."
          />
        ) : cart.isPending ? (
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </div>
        ) : cart.isError ? (
          <ErrorState error={cart.error} onRetry={() => void cart.refetch()} retrying={cart.isFetching} />
        ) : cart.data.items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="size-7" aria-hidden="true" />}
            title="Seu carrinho está vazio"
            description="Adicione produtos ao carrinho antes de finalizar a compra."
            action={
              <Link to="/produtos" className={buttonStyles({ variant: "outline" })}>
                Ver produtos
              </Link>
            }
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="font-display text-xl font-semibold">Endereço de entrega</h2>
              <div className="mt-4">
                <AddressPicker selectedId={selectedAddress?.address_id ?? null} onSelect={setSelectedAddress} />
              </div>
            </div>

            <aside className="h-fit rounded-md border border-sand-200 bg-white p-6">
              <h2 className="font-display text-xl font-semibold">Resumo do pedido</h2>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {cart.data.items.map((item) => (
                  <li key={item.cart_item_id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {item.quantity_item}× {item.product.product_name}
                    </span>
                    <span className="shrink-0 font-medium text-ink">{formatBRL(item.subtotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-4">
                <p className="text-base font-semibold">Total</p>
                <p className="text-2xl font-semibold text-oxblood-700">{formatBRL(cart.data.total_geral)}</p>
              </div>
              <p className="mt-1 text-xs text-ink-soft">O frete é calculado e cobrado separadamente após a confirmação.</p>

              {createOrder.isError && (
                <Alert tone="error" className="mt-4">
                  {toUserMessage(createOrder.error, "Não foi possível confirmar o pedido.")}
                </Alert>
              )}

              <Button
                size="lg"
                fullWidth
                className="mt-6"
                disabled={!selectedAddress}
                loading={createOrder.isPending}
                onClick={handleConfirm}
              >
                Confirmar pedido
              </Button>
            </aside>
          </div>
        )}
      </div>
    </Container>
  );
}