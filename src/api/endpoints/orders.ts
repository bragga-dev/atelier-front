import { http } from "../http";
import type { OrderCancelIn, OrderCreateIn, OrderOut } from "../types";

export const ordersApi = {
  list: (signal?: AbortSignal) => http.get<OrderOut[]>("/orders/", { signal }),

  get: (orderId: string, signal?: AbortSignal) => http.get<OrderOut>(`/orders/${orderId}`, { signal }),

  /** Faz o checkout do carrinho: cria o pedido, baixa o estoque e esvazia o carrinho. */
  create: (payload: OrderCreateIn) => http.post<OrderOut>("/orders/", payload),

  cancel: (orderId: string, payload?: OrderCancelIn) => http.post<OrderOut>(`/orders/${orderId}/cancel`, payload),
};