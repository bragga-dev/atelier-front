import { http } from "../http";
import type { PaymentCreateIn, PaymentOut } from "../types";

export const paymentsApi = {
  listForOrder: (orderId: string, signal?: AbortSignal) =>
    http.get<PaymentOut[]>(`/orders/${orderId}/payments`, { signal }),

  /** Gera uma cobrança na Asaas para o pedido (PIX ou boleto — cartão fica para uma próxima fase). */
  create: (orderId: string, payload: PaymentCreateIn) =>
    http.post<PaymentOut>(`/orders/${orderId}/payments`, payload),
};