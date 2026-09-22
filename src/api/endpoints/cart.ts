import { http } from "../http";
import type { CartItemCreateIn, CartOut } from "../types";

export const cartApi = {
  get: (signal?: AbortSignal) => http.get<CartOut>("/cart/", { signal }),

  addItem: (payload: CartItemCreateIn) => http.post<CartOut>("/cart/items", payload),
};