import { http } from "../http";
import type { AddressCreateIn, AddressOut, AddressUpdateIn } from "../types";

export const addressesApi = {
  list: (signal?: AbortSignal) => http.get<AddressOut[]>("/address/my-addresses", { signal }),

  create: (payload: AddressCreateIn) => http.post<AddressOut>("/address/my-addresses", payload),

  update: (addressId: string, payload: AddressUpdateIn) =>
    http.patch<AddressOut>(`/address/my-addresses/${addressId}`, payload),

  remove: (addressId: string) => http.delete<void>(`/address/my-addresses/${addressId}`),

  setPreferential: (addressId: string) =>
    http.post<AddressOut>(`/address/my-addresses/${addressId}/set-preferential`),
};