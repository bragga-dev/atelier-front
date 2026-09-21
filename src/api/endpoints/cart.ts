import { http } from "../http";
import type { CartOut } from "../types";

export const cartApi = {
  get: (signal?: AbortSignal) => http.get<CartOut>("/cart/", { signal }),
};
