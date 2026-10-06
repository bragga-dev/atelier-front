import { PackageSearch } from "lucide-react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCartEnabled } from "@/features/cart/queries";
import { OrderListItem } from "@/features/orders/components/OrderListItem";
import { useOrders } from "@/features/orders/queries";

export default function OrdersPage() {
  const isClientAccount = useCartEnabled();
  const orders = useOrders();

  return (
    <Container className="py-2 sm:py-4">
      <h1 className="mb-8 text-4xl font-semibold sm:text-5xl">Meus pedidos</h1>

      {!isClientAccount ? (
        <EmptyState icon={<PackageSearch className="size-7" aria-hidden="true" />} title="Sem pedidos por aqui" description="Contas administrativas não fazem compras na loja." />
      ) : orders.isPending ? (
        <div className="space-y-4" aria-busy="true" aria-label="Carregando pedidos">
          <Skeleton className="h-24 rounded-[var(--radius-card)]" />
          <Skeleton className="h-24 rounded-[var(--radius-card)]" />
        </div>
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} retrying={orders.isFetching} />
      ) : orders.data && orders.data.length > 0 ? (
        <ul className="space-y-4">
          {orders.data.map((order) => (
            <OrderListItem key={order.order_id} order={order} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<PackageSearch className="size-7" aria-hidden="true" />}
          title="Você ainda não fez nenhum pedido"
          description="Que tal dar uma olhada nas nossas peças?"
          action={
            <Link to="/produtos" className={buttonStyles()}>
              Ver produtos
            </Link>
          }
        />
      )}
    </Container>
  );
}