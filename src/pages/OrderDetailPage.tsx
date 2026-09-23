import { useState } from "react";
import { Copy } from "lucide-react";
import { Link, useParams } from "react-router";
import { toUserMessage } from "@/api/errors";
import type { PaymentBillingType } from "@/api/types";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { useCancelOrder } from "@/features/orders/mutations";
import { useOrder } from "@/features/orders/queries";
import { orderStatusTone, paymentStatusLabel, paymentStatusTone } from "@/features/orders/status";
import { useCreatePayment } from "@/features/payments/mutations";
import { useOrderPayments } from "@/features/payments/queries";
import { formatBRL } from "@/lib/format";
import { productPath } from "@/lib/slug";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PaymentSection({ orderId, orderStatus }: { orderId: string; orderStatus: string }) {
  const payments = useOrderPayments(orderId);
  const createPayment = useCreatePayment(orderId);
  const [copied, setCopied] = useState(false);

  if (payments.isPending) return <Skeleton className="h-32" />;
  if (payments.isError) {
    return <ErrorState error={payments.error} onRetry={() => void payments.refetch()} retrying={payments.isFetching} title="Não conseguimos carregar o pagamento" />;
  }

  const latest = [...payments.data].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  const awaitingRetry = latest ? !["PENDING", ...(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"] as const)].includes(latest.status as never) : false;
  const canChooseBillingType = orderStatus === "PENDING" && (!latest || awaitingRetry);

  return (
    <div className="rounded-md border border-sand-200 bg-white p-6">
      <h2 className="font-display text-xl font-semibold">Pagamento</h2>

      {createPayment.isError && (
        <Alert tone="error" className="mt-4">
          {toUserMessage(createPayment.error, "Não foi possível gerar a cobrança.")}
        </Alert>
      )}

      {latest && (
        <div className="mt-4 space-y-3">
          <StatusBadge tone={paymentStatusTone(latest.status)} label={paymentStatusLabel(latest.status)} />

          {latest.status === "PENDING" && latest.billing_type === "PIX" && (
            <div className="space-y-3 rounded-md bg-sand/60 p-4">
              {latest.pix_qr_code && (
                <img
                  src={latest.pix_qr_code.startsWith("data:") ? latest.pix_qr_code : `data:image/png;base64,${latest.pix_qr_code}`}
                  alt="QR Code Pix"
                  className="mx-auto size-48"
                />
              )}
              {latest.pix_copy_paste && (
                <div className="flex items-center gap-2">
                  <input readOnly value={latest.pix_copy_paste} className="h-10 flex-1 truncate rounded-md border border-sand-200 bg-white px-3 text-xs" />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(latest.pix_copy_paste ?? "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {latest.status === "PENDING" && latest.billing_type === "BOLETO" && latest.bank_slip_url && (
            <a href={latest.bank_slip_url} target="_blank" rel="noreferrer" className="inline-block font-semibold text-oxblood-700 underline">
              Abrir boleto
            </a>
          )}

          {latest.invoice_url && (
            <a href={latest.invoice_url} target="_blank" rel="noreferrer" className="block text-sm text-ink-soft underline">
              Ver fatura completa
            </a>
          )}
        </div>
      )}

      {canChooseBillingType && (
        <div className="mt-4 flex flex-wrap gap-3">
          {(["PIX", "BOLETO"] as PaymentBillingType[]).map((type) =>
            type === "CREDIT_CARD" ? null : (
              <Button
                key={type}
                type="button"
                variant="outline"
                loading={createPayment.isPending && createPayment.variables === type}
                disabled={createPayment.isPending}
                onClick={() => createPayment.mutate(type)}
              >
                Pagar com {type === "PIX" ? "Pix" : "boleto"}
              </Button>
            ),
          )}
        </div>
      )}

      {!latest && !canChooseBillingType && <p className="mt-4 text-sm text-ink-soft">Nenhuma cobrança gerada para este pedido.</p>}
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const order = useOrder(orderId);
  const cancelOrder = useCancelOrder();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (order.isPending) {
    return (
      <Container className="py-8 sm:py-12">
        <Skeleton className="h-64" />
      </Container>
    );
  }

  if (order.isError) {
    return (
      <Container className="py-8 sm:py-12">
        <ErrorState error={order.error} onRetry={() => void order.refetch()} retrying={order.isFetching} title="Não encontramos esse pedido" />
      </Container>
    );
  }

  const data = order.data;

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Pedido {data.code}</h1>
          <p className="mt-1 text-sm text-ink-soft">Feito em {formatDateTime(data.created_at)}</p>
        </div>
        <StatusBadge tone={orderStatusTone(data.order_status)} label={data.order_status_label} />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <ul className="rounded-md border border-sand-200 bg-white">
            {(data.items ?? []).map((item) => (
              <li key={item.order_item_id} className="flex gap-4 border-b border-sand-200 p-4 last:border-0">
                <Link to={productPath(item.product)} className="shrink-0">
                  <ProductImage src={item.product.cover_image?.product_image_url} alt={item.product.product_name} className="size-20 rounded-md border border-sand-200" />
                </Link>
                <div className="flex flex-1 flex-col justify-center">
                  <Link to={productPath(item.product)} className="font-medium text-ink hover:text-oxblood-700">
                    {item.product.product_name}
                  </Link>
                  <p className="text-sm text-ink-soft">
                    {item.order_item_quantity}× {formatBRL(item.order_item_price)}
                  </p>
                </div>
                <p className="self-center font-semibold text-ink">{formatBRL(item.subtotal)}</p>
              </li>
            ))}
          </ul>

          <PaymentSection orderId={data.order_id} orderStatus={data.order_status} />
        </div>

        <aside className="h-fit space-y-4 rounded-md border border-sand-200 bg-white p-6">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-medium">{formatBRL(data.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Frete</dt>
              <dd className="font-medium">{formatBRL(data.order_shipping_total)}</dd>
            </div>
          </dl>
          <div className="flex items-center justify-between border-t border-sand-200 pt-4">
            <p className="text-base font-semibold">Total</p>
            <p className="text-2xl font-semibold text-oxblood-700">{formatBRL(data.total_geral)}</p>
          </div>

          {data.order_status === "PENDING" && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              loading={cancelOrder.isPending}
              onClick={() => {
                if (!confirmingCancel) {
                  setConfirmingCancel(true);
                  return;
                }
                cancelOrder.mutate(data.order_id);
                setConfirmingCancel(false);
              }}
              onBlur={() => setConfirmingCancel(false)}
            >
              {confirmingCancel ? "Confirmar: cancelar pedido?" : "Cancelar pedido"}
            </Button>
          )}
          {cancelOrder.isError && (
            <Alert tone="error">{toUserMessage(cancelOrder.error, "Não foi possível cancelar o pedido.")}</Alert>
          )}
        </aside>
      </div>
    </Container>
  );
}