import type { OrderStatus, PaymentStatus } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS, PAYMENT_STATUS } from "../status";

export function OrderStatusBadge({ status, label }: { status: OrderStatus; label?: string }) {
  const { tone, label: fallback } = ORDER_STATUS[status];
  return <Badge tone={tone}>{label ?? fallback}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { tone, label } = PAYMENT_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}