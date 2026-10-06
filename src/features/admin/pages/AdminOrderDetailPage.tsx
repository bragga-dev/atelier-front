// frontend/src/features/admin/pages/AdminOrderDetailPage.tsx
import { useState } from "react";
import { ExternalLink, Printer, Truck } from "lucide-react";
import { Link, useParams } from "react-router";
import { isApiError, toUserMessage } from "@/api/errors";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/features/orders/components/StatusBadges";
import { OrderSummaryCard } from "@/features/orders/components/OrderSummaryCard";
import { formatDateTime } from "@/lib/format";
import { safeExternalUrl } from "@/lib/safe-url";
import { useAdminOrder, useGenerateLabel } from "../hooks";
import { SHIPPING_TONE } from "./AdminOrdersPage";

export default function AdminOrderDetailPage() {
  const { orderId = "" } = useParams();
  const order = useAdminOrder(orderId);
  const generate = useGenerateLabel(orderId);
  const [confirming, setConfirming] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);

  if (order.isPending) return <Skeleton className="h-96" />;
  if (order.isError) {
    const notFound = isApiError(order.error) && order.error.status === 404;
    return <ErrorState error={order.error} title={notFound ? "Pedido não encontrado" : undefined} onRetry={notFound ? undefined : () => void order.refetch()} retrying={order.isFetching} />;
  }

  const o = order.data;
  const labelUrl = safeExternalUrl(o.shipping_label_url);
  const canGenerate = o.order_status === "COMPLETED" && o.shipping_status === "pending" && !o.frenet_order_id;

  const confirmGenerate = () => {
    setLabelError(null);
    generate.mutate(undefined, {
      onSuccess: () => setConfirming(false),
      onError: (error) => { setLabelError(toUserMessage(error, "Não foi possível gerar a etiqueta.")); },
    });
  };

  return (
    <>
      <PageHeader
        title={`Pedido ${o.code}`}
        description={`Criado em ${formatDateTime(o.created_at)}`}
        actions={<Link to="/admin/pedidos" className="text-sm font-semibold text-oxblood-700 hover:underline">← Voltar para pedidos</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <OrderSummaryCard order={o} />

        <div className="space-y-6">
          <Section title="Cliente">
            <p className="font-semibold">{o.customer_name}</p>
            <p className="text-sm text-ink-soft">{o.customer_email}</p>
            <p className="mt-3 text-sm">{o.shipping_address_summary}</p>
            <div className="mt-3"><OrderStatusBadge status={o.order_status} label={o.order_status_label} /></div>
          </Section>

          <Section title="Envio">
            <div className="flex items-center gap-2"><Truck className="size-5 text-ink-soft" aria-hidden="true" /><Badge tone={SHIPPING_TONE[o.shipping_status] ?? "neutral"}>{o.shipping_status_label}</Badge></div>
            {o.shipping_service_code && <p className="mt-2 text-sm text-ink-soft">Serviço (Frenet): {o.shipping_service_code}</p>}
            {o.shipping_tracking_code && <p className="mt-1 text-sm">Rastreio: <span className="font-mono font-semibold">{o.shipping_tracking_code}</span></p>}
            {o.shipped_at && <p className="mt-1 text-sm text-ink-soft">Postado em {formatDateTime(o.shipped_at)}</p>}

            {labelUrl && (
              <a href={labelUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-oxblood-700 hover:underline">
                <Printer className="size-4" aria-hidden="true" />Abrir etiqueta<ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}

            {canGenerate && (
              <div className="mt-4">
                <Button onClick={() => { setLabelError(null); setConfirming(true); }}>Gerar etiqueta</Button>
                <p className="mt-2 text-xs text-ink-soft">Cobra o valor da etiqueta do saldo da sua carteira Frenet.</p>
              </div>
            )}
            {o.order_status !== "COMPLETED" && o.shipping_status === "pending" && (
              <p className="mt-3 text-sm text-ink-soft">A etiqueta só pode ser gerada depois que o pagamento for confirmado.</p>
            )}
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Gerar etiqueta de envio?"
        description="O valor será debitado do saldo da carteira Frenet agora. O destinatário e os dados fiscais não podem ser editados depois — confira o endereço."
        confirmLabel="Gerar e pagar etiqueta"
        loading={generate.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmGenerate}
      >
        <p className="mt-3 rounded-md bg-sand p-3 text-sm">{o.customer_name} — {o.shipping_address_summary}</p>
        {labelError && <Alert tone="error" className="mt-3">{labelError}</Alert>}
      </ConfirmDialog>
    </>
  );
}