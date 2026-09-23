import type { PaymentStatus } from "@/api/types";
import type { StatusTone } from "@/components/ui/StatusBadge";

/** order_status_label / order_status já vêm prontos do backend — só decidimos a cor. */
export function orderStatusTone(status: string): StatusTone {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED" || status === "REFUNDED" || status === "FAILED") return "error";
  return "pending";
}

const SUCCESS_PAYMENT_STATUSES: PaymentStatus[] = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];
const ERROR_PAYMENT_STATUSES: PaymentStatus[] = [
  "OVERDUE",
  "CANCELLED",
  "REFUNDED",
  "REFUND_REQUESTED",
  "REFUND_IN_PROGRESS",
  "CHARGEBACK_REQUESTED",
  "CHARGEBACK_DISPUTE",
];

export function paymentStatusTone(status: PaymentStatus): StatusTone {
  if (SUCCESS_PAYMENT_STATUSES.includes(status)) return "success";
  if (ERROR_PAYMENT_STATUSES.includes(status)) return "error";
  return "pending";
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Aguardando pagamento",
  RECEIVED: "Pago",
  CONFIRMED: "Pago",
  RECEIVED_IN_CASH: "Pago",
  OVERDUE: "Vencido",
  REFUNDED: "Estornado",
  REFUND_REQUESTED: "Estorno solicitado",
  REFUND_IN_PROGRESS: "Estorno em andamento",
  CHARGEBACK_REQUESTED: "Chargeback solicitado",
  CHARGEBACK_DISPUTE: "Chargeback em disputa",
  AWAITING_CHARGEBACK_REVERSAL: "Aguardando reversão de chargeback",
  DUNNING_REQUESTED: "Cobrança solicitada",
  DUNNING_RECEIVED: "Cobrança recebida",
  AWAITING_RISK_ANALYSIS: "Em análise",
  CANCELLED: "Cancelado",
};

export function paymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status];
}