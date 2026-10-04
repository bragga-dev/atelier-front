import type { BadgeTone } from "@/components/ui/Badge";
import type { OrderStatus, PaymentBillingType, PaymentStatus } from "@/api/types";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Aguardando pagamento", tone: "warning" },
  COMPLETED: { label: "Pago", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "neutral" },
  REFUNDED: { label: "Estornado", tone: "info" },
  FAILED: { label: "Falhou", tone: "danger" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Aguardando pagamento", tone: "warning" },
  AWAITING_RISK_ANALYSIS: { label: "Em análise", tone: "warning" },
  RECEIVED: { label: "Pago", tone: "success" },
  CONFIRMED: { label: "Pago", tone: "success" },
  RECEIVED_IN_CASH: { label: "Pago", tone: "success" },
  OVERDUE: { label: "Vencido", tone: "danger" },
  CANCELLED: { label: "Cancelado", tone: "neutral" },
  REFUNDED: { label: "Estornado", tone: "info" },
  REFUND_REQUESTED: { label: "Estorno solicitado", tone: "info" },
  REFUND_IN_PROGRESS: { label: "Estorno em andamento", tone: "info" },
  CHARGEBACK_REQUESTED: { label: "Contestação em análise", tone: "danger" },
  CHARGEBACK_DISPUTE: { label: "Contestação em análise", tone: "danger" },
  AWAITING_CHARGEBACK_REVERSAL: { label: "Contestação em análise", tone: "danger" },
  DUNNING_REQUESTED: { label: "Em cobrança", tone: "danger" },
  DUNNING_RECEIVED: { label: "Pago", tone: "success" },
};

export const BILLING_TYPE_LABEL: Record<PaymentBillingType, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de crédito",
};

/** Cobrança em aberto: ainda pode ser paga (mesma regra do backend: `get_open_payment_for_order`). */
export const OPEN_PAYMENT_STATUSES: readonly PaymentStatus[] = ["PENDING", "AWAITING_RISK_ANALYSIS"];

/** Cobrança já paga (mesma regra do backend: `_PAID_STATUSES`). */
export const PAID_PAYMENT_STATUSES: readonly PaymentStatus[] = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

export const isOpenPayment = (status: PaymentStatus): boolean => OPEN_PAYMENT_STATUSES.includes(status);
export const isPaidPayment = (status: PaymentStatus): boolean => PAID_PAYMENT_STATUSES.includes(status);