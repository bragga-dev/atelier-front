// frontend/src/features/admin/pages/AdminOrdersPage.tsx
import { useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router";
import { DataTable } from "@/components/panel/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { PagerButtons } from "@/components/panel/PagerButtons";
import { Badge } from "@/components/ui/Badge";
import { SelectField, TextField } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/features/orders/components/StatusBadges";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatBRL, formatDateTime } from "@/lib/format";
import { useAdminOrders } from "../hooks";

export const SHIPPING_TONE: Record<string, "neutral" | "info" | "warning" | "success"> = {
  pending: "neutral", label_generated: "warning", shipped: "info", in_transit: "info", delivered: "success",
};

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(text.trim(), 400);
  const orders = useAdminOrders({ status: status || undefined, search: search || undefined, page });

  return (
    <>
      <PageHeader title="Pedidos" description="Todos os pedidos da loja. Gere a etiqueta de envio dos pedidos pagos." />

      <div className="mb-4 grid gap-4 sm:max-w-2xl sm:grid-cols-[1fr_14rem]">
        <TextField label="Buscar" placeholder="Código, e-mail ou nome do cliente" value={text} onChange={(e) => { setText(e.target.value); setPage(1); }} />
        <SelectField label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos</option>
          <option value="PENDING">Aguardando pagamento</option>
          <option value="COMPLETED">Pago</option>
          <option value="CANCELLED">Cancelado</option>
          <option value="REFUNDED">Estornado</option>
          <option value="FAILED">Falhou</option>
        </SelectField>
      </div>

      {orders.isPending ? <Skeleton className="h-64" /> : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} retrying={orders.isFetching} />
      ) : orders.data.items.length === 0 ? (
        <p className="flex items-center gap-2 py-10 text-ink-soft"><Search className="size-5" aria-hidden="true" />Nenhum pedido encontrado.</p>
      ) : (
        <>
          <DataTable caption="Pedidos" rows={orders.data.items} rowKey={(o) => o.order_id}
            columns={[
              { header: "Pedido", cell: (o) => <Link to={`/admin/pedidos/${o.order_id}`} className="font-semibold text-oxblood-700 hover:underline">{o.code}</Link> },
              { header: "Cliente", cell: (o) => <span><span className="block font-semibold">{o.customer_name}</span><span className="block text-xs text-ink-soft">{o.customer_email}</span></span> },
              { header: "Data", cell: (o) => formatDateTime(o.created_at), hideOnMobile: true },
              { header: "Total", cell: (o) => formatBRL(o.total_geral) },
              { header: "Pagamento", cell: (o) => <OrderStatusBadge status={o.order_status} label={o.order_status_label} /> },
              { header: "Envio", cell: (o) => <Badge tone={SHIPPING_TONE[o.shipping_status] ?? "neutral"}>{o.shipping_status_label}</Badge>, hideOnMobile: true },
            ]} />
          <PagerButtons page={orders.data.page} pages={orders.data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}