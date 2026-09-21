import { http } from "../http";
import type { ContactCreateIn, ContactOut } from "../types";

export const contactApi = {
  create: (payload: ContactCreateIn) => http.post<ContactOut>("/contact/", payload, { auth: false }),
};