import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/api/endpoints/payments";
import { queryKeys } from "@/api/query-keys";

export function useOrderPayments(orderId: string) {
  return useQuery({
    queryKey: queryKeys.payments.forOrder(orderId),
    queryFn: ({ signal }) => paymentsApi.listForOrder(orderId, signal),
    enabled: Boolean(orderId),
  });
}