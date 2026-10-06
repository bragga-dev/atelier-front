import { http } from "../http";
import type { AdminOrderOut, AdminOrderPage, OrderCancelIn, OrderCreateIn, OrderOut } from "../types";

export const ordersApi = {
  list: (signal?: AbortSignal) => http.get<OrderOut[]>("/orders/", { signal }),

  get: (orderId: string, signal?: AbortSignal) => http.get<OrderOut>(`/orders/${orderId}`, { signal }),

  /** Faz o checkout do carrinho: cria o pedido, baixa o estoque e esvazia o carrinho. */
  create: (payload: OrderCreateIn) => http.post<OrderOut>("/orders/", payload),

  cancel: (orderId: string, payload?: OrderCancelIn) => http.post<OrderOut>(`/orders/${orderId}/cancel`, payload),

  // Admin
  adminList: (
    params: { status?: string; search?: string; page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
  ) =>
    http.get<AdminOrderPage>("/orders/admin/list", {
      signal,
      query: { status: params.status, search: params.search, page: params.page ?? 1, page_size: params.pageSize ?? 20 },
    }),

  adminGet: (orderId: string, signal?: AbortSignal) => http.get<AdminOrderOut>(`/orders/admin/${orderId}`, { signal }),

  /** Gera e paga (saldo da carteira Frenet) a etiqueta de envio. */
  generateLabel: (orderId: string) =>
    http.post<{ success: boolean; frenet_shipment_id: string; tracking_code: string | null; label_url: string }>(
      `/orders/${orderId}/generate-label`,
    ),
};