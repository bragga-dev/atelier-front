import { http } from "../http";
import type { ShippingOptionOut } from "../types";

/** CEP só com dígitos — o backend aceita com ou sem máscara, mas normaliza igual. */
export const shippingApi = {
  quote: (productId: string, recipientCep: string, quantity: number, signal?: AbortSignal) =>
    http.post<ShippingOptionOut[]>(
      `/shipping/quote/${productId}`,
      { recipient_cep: recipientCep.replace(/\D/g, ""), quantity },
      { signal, auth: false },
    ),
};