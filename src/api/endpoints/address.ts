import { isApiError } from "../errors";
import { http } from "../http";
import type { AddressCreateIn, AddressOut } from "../types";

export const addressApi = {
  /** O backend responde 404 quando o cliente ainda não tem nenhum endereço — tratamos como lista vazia. */
  list: async (signal?: AbortSignal): Promise<AddressOut[]> => {
    try {
      return await http.get<AddressOut[]>("/address/my-addresses", { signal });
    } catch (error) {
      if (isApiError(error) && error.status === 404) return [];
      throw error;
    }
  },

  create: (payload: AddressCreateIn) => http.post<AddressOut>("/address/my-addresses", payload),
};