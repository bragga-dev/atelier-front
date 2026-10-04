import { queryOptions, useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/api/endpoints/orders";
import { paymentsApi } from "@/api/endpoints/payments";
import { isApiError } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import type { OrderOut, PaymentOut } from "@/api/types";
import { useCartEnabled } from "@/features/cart/queries";
import { isOpenPayment } from "./status";

const POLL_INTERVAL_MS = 5000;

export function useOrders() {
  const enabled = useCartEnabled();
  return useQuery({
    queryKey: queryKeys.orders.list,
    queryFn: ({ signal }) => ordersApi.list(signal),
    enabled,
    staleTime: 30_000,
  });
}

export function orderQueryOptions(orderId: string) {
  return queryOptions({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: ({ signal }) => ordersApi.get(orderId, signal),
    staleTime: 15_000,
  });
}

/**
 * Enquanto o pedido aguarda pagamento e existe uma cobrança em aberto, consulta de tempos em tempos:
 * o status muda por webhook da Asaas (Pix/boleto pagos fora do site), não por ação da pessoa aqui.
 */
export function useOrder(orderId: string, options: { poll?: boolean } = {}) {
  const enabled = useCartEnabled();
  return useQuery({
    ...orderQueryOptions(orderId),
    enabled,
    // Um 404 é definitivo (pedido de outra conta ou inexistente).
    retry: (failureCount, error) => !isApiError(error) && failureCount < 2,
    refetchInterval: (query) => {
      const order = query.state.data as OrderOut | undefined;
      return options.poll && order?.order_status === "PENDING" ? POLL_INTERVAL_MS : false;
    },
  });
}

export function useOrderPayments(orderId: string, options: { poll?: boolean } = {}) {
  const enabled = useCartEnabled();
  return useQuery({
    queryKey: queryKeys.orders.payments(orderId),
    queryFn: ({ signal }) => paymentsApi.forOrder(orderId, signal),
    enabled,
    staleTime: 10_000,
    refetchInterval: (query) => {
      const payments = query.state.data as PaymentOut[] | undefined;
      const hasOpen = payments?.some((payment) => isOpenPayment(payment.status));
      return options.poll && hasOpen ? POLL_INTERVAL_MS : false;
    },
  });
}