import { http } from "../http";
import type { ClientOut, ClientUpdateIn } from "../types";

export const profileApi = {
  updateClient: (payload: ClientUpdateIn) => http.patch<ClientOut>("/auth/update-client-profile", payload),
};