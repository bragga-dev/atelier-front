import { useState } from "react";
import { Ban, PackageX } from "lucide-react";
import { Link, useParams } from "react-router";
import { isApiError } from "@/api/errors";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCartEnabled } from "@/features/cart/queries";
import { OrderReviews } from "@/features/account/components/OrderReviews";
import { OrderSummaryCard } from "@/features/orders/components/OrderSummaryCard";
import { OrderStatusBadge } from "@/features/orders/components/StatusBadges";
import { useCancelOrder } from "@/features/orders/mutations";
import { useOrder } from "@/features/orders/queries";
import { formatDate } from "@/lib/format";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const isClientAccount = useCartEnabled();
  const order = useOrder(orderId ?? "");
  const cancelOrder = useCancelOrder(orderId ?? "");
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!isClientAccount) {
    return (
      <Container className="py-10">
        <EmptyState icon={<PackageX className="size-7" aria-hidden="true" />} title="Sem pedidos por aqui" description="Contas administrativas não fazem compras na loja." />
      </Container>
    );
  }

  if (order.isPending) {
    return (
      <Container className="py-2 sm:py-4">
        <Skeleton className="mb-8 h-12 w-64" />
        <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
          <Skeleton className="h-64 rounded-[var(--radius-card)]" />
          <Skeleton className="h-64 rounded-[var(--radius-card)]" />
        </div>
      </Container>
    );
  }

  if (order.isError) {
    if (isApiError(order.error) && order.error.status === 404) {
      return (
        <Container className="py-10">
          <EmptyState
            icon={<PackageX className="size-7" aria-hidden="true" />}
            title="Pedido não encontrado"
            action={
              <Link to="/painel/meus-pedidos" className={buttonStyles({ variant: "outline" })}>
                Ver meus pedidos
              </Link>
            }
          />
        </Container>
      );
    }
    return (
      <Container className="py-10">
        <ErrorState error={order.error} onRetry={() => void order.refetch()} retrying={order.isFetching} />
      </Container>
    );
  }

  const data = order.data!;
  const canCancel = data.order_status === "PENDING";
  const canPay = data.order_status === "PENDING";

  return (
    <Container className="py-2 sm:py-4">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-soft">Feito em {formatDate(data.created_at)}</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Pedido {data.code}</h1>
        </div>
        <OrderStatusBadge status={data.order_status} label={data.order_status_label} />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {canPay && (
            <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6">
              <p className="font-semibold">Este pedido ainda não foi pago.</p>
              <Link to={`/painel/meus-pedidos/${data.order_id}/pagamento`} className={`${buttonStyles()} mt-4 inline-flex`}>
                Ir para o pagamento
              </Link>
            </div>
          )}

          {data.shipping_status !== "pending" && (
            <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6">
              <p className="font-semibold">Envio: {data.shipping_status_label}</p>
              {data.shipping_tracking_code && <p className="mt-1 text-sm text-ink-soft">Código de rastreio: <span className="font-mono font-semibold text-ink">{data.shipping_tracking_code}</span></p>}
            </div>
          )}

          <OrderReviews order={data} />

          {canCancel && (
            <Button variant="outline" onClick={() => setConfirmingCancel(true)}>
              <Ban className="size-4" aria-hidden="true" />
              Cancelar pedido
            </Button>
          )}
        </div>

        <OrderSummaryCard order={data} />
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancelar este pedido?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Cancelar pedido"
        cancelLabel="Voltar"
        loading={cancelOrder.isPending}
        onCancel={() => setConfirmingCancel(false)}
        onConfirm={() => cancelOrder.mutate(undefined, { onSuccess: () => setConfirmingCancel(false) })}
      />
    </Container>
  );
}