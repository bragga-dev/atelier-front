import { http } from "../http";
import type { CartItemCreateIn, CartItemUpdateIn, CartOut } from "../types";

export const cartApi = {
  get: (signal?: AbortSignal) => http.get<CartOut>("/cart/", { signal }),

  addItem: (payload: CartItemCreateIn) => http.post<CartOut>("/cart/items", payload),

  /** Define a quantidade exata do item (não soma). */
  updateItem: (cartItemId: string, payload: CartItemUpdateIn) =>
    http.patch<CartOut>(`/cart/items/${cartItemId}`, payload),

  removeItem: (cartItemId: string) => http.delete<CartOut>(`/cart/items/${cartItemId}`),

  clear: () => http.delete<CartOut>("/cart/"),
};