import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/api/endpoints/payments";
import { queryKeys } from "@/api/query-keys";
import type { PaymentBillingType, PaymentOut } from "@/api/types";

/** Gera uma cobrança PIX ou boleto para o pedido. Cartão de crédito fica para uma fase futura. */
export function useCreatePayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (billingType: Extract<PaymentBillingType, "PIX" | "BOLETO">) =>
      paymentsApi.create(orderId, { billing_type: billingType }),
    onSuccess: (payment) => {
      queryClient.setQueryData<PaymentOut[]>(queryKeys.payments.forOrder(orderId), (current) => [
        payment,
        ...(current ?? []).filter((p) => p.payment_id !== payment.payment_id),
      ]);
    },
  });
}