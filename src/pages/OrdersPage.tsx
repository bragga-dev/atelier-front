import { Package } from "lucide-react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/features/auth/auth-context";
import { useOrders } from "@/features/orders/queries";
import { orderStatusTone } from "@/features/orders/status";
import { formatBRL } from "@/lib/format";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function OrdersPage() {
  const { me } = useAuth();
  const isClientAccount = me?.user.role === "client";
  const orders = useOrders();

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Meus pedidos</h1>

      <div className="mt-8">
        {!isClientAccount ? (
          <EmptyState
            icon={<Package className="size-7" aria-hidden="true" />}
            title="Conta administrativa"
            description="Esta conta é administrativa e não faz compras na loja."
          />
        ) : orders.isPending ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : orders.isError ? (
          <ErrorState error={orders.error} onRetry={() => void orders.refetch()} retrying={orders.isFetching} />
        ) : orders.data.length === 0 ? (
          <EmptyState
            icon={<Package className="size-7" aria-hidden="true" />}
            title="Você ainda não fez nenhum pedido"
            description="Seus pedidos aparecem aqui depois do checkout."
            action={
              <Link to="/produtos" className={buttonStyles({ variant: "outline" })}>
                Ver produtos
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {orders.data.map((order) => (
              <li key={order.order_id}>
                <Link
                  to={`/painel/meus-pedidos/${order.order_id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-sand-200 bg-white p-4 transition-shadow hover:shadow-card"
                >
                  <div>
                    <p className="font-semibold text-ink">Pedido {order.code}</p>
                    <p className="text-sm text-ink-soft">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge tone={orderStatusTone(order.order_status)} label={order.order_status_label} />
                    <p className="font-semibold text-oxblood-700">{formatBRL(order.total_geral)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}