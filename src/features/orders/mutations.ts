import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/api/endpoints/orders";
import { paymentsApi } from "@/api/endpoints/payments";
import { queryKeys } from "@/api/query-keys";
import type { PaymentCreateIn, PaymentOut } from "@/api/types";
import { toast } from "@/lib/toast";

export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) => ordersApi.cancel(orderId, reason ? { reason } : undefined),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(orderId), order);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.list });
      // O estoque do pedido voltou para os produtos.
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Pedido cancelado.");
    },
  });
}

export function useCreatePayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentCreateIn) => paymentsApi.create(orderId, payload),
    onSuccess: (payment) => {
      queryClient.setQueryData<PaymentOut[]>(queryKeys.orders.payments(orderId), (current = []) => [
        payment,
        ...current.filter((existing) => existing.payment_id !== payment.payment_id),
      ]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    },
    // Se a Asaas recusou, o backend cancela a cobrança local — a lista precisa refletir isso.
    onError: () => void queryClient.invalidateQueries({ queryKey: queryKeys.orders.payments(orderId) }),
    // O formulário de pagamento mostra o erro (ex.: cartão recusado) junto dos campos.
    meta: { errorToast: false },
  });
}