import { http } from "../http";
import type { OrderCancelIn, OrderCreateIn, OrderOut } from "../types";

export const ordersApi = {
  list: (signal?: AbortSignal) => http.get<OrderOut[]>("/orders/", { signal }),

  get: (orderId: string, signal?: AbortSignal) => http.get<OrderOut>(`/orders/${orderId}`, { signal }),

  /** Faz o checkout do carrinho atual do cliente autenticado e cria o pedido. */
  create: (payload: OrderCreateIn) => http.post<OrderOut>("/orders/", payload),

  cancel: (orderId: string, payload: OrderCancelIn | null = null) =>
    http.post<OrderOut>(`/orders/${orderId}/cancel`, payload),
};