import { http } from "../http";
import type { PaymentCreateIn, PaymentOut } from "../types";

export const paymentsApi = {
  forOrder: (orderId: string, signal?: AbortSignal) =>
    http.get<PaymentOut[]>(`/orders/${orderId}/payments`, { signal }),

  create: (orderId: string, payload: PaymentCreateIn) =>
    http.post<PaymentOut>(`/orders/${orderId}/payments`, payload),

  /** Sem `value`, o backend estorna o valor integral. */
  refund: (paymentId: string) => http.post<PaymentOut>(`/payments/${paymentId}/refund`, {}),
};