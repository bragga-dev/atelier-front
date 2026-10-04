import { http } from "../http";
import type { AddressCreateIn, AddressOut } from "../types";

export const addressesApi = {
  list: (signal?: AbortSignal) => http.get<AddressOut[]>("/address/my-addresses", { signal }),

  create: (payload: AddressCreateIn) => http.post<AddressOut>("/address/my-addresses", payload),
};