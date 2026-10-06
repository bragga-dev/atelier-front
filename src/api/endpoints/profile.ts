import { http } from "../http";
import type { AdminProfileOut, AdminProfileUpdateIn, ClientOut, ClientUpdateIn } from "../types";

function photoForm(file: File): FormData {
  const form = new FormData();
  form.append("photo", file);
  return form;
}

export const profileApi = {
  updateClient: (payload: ClientUpdateIn) => http.patch<ClientOut>("/auth/update-client-profile", payload),
  updateAdmin: (payload: AdminProfileUpdateIn) => http.patch<AdminProfileOut>("/auth/update-admin-profile", payload),

  uploadClientPhoto: (file: File) => http.post<ClientOut>("/auth/upload-client-photo", photoForm(file)),
  deleteClientPhoto: () => http.delete<ClientOut>("/auth/delete-client-photo"),
  uploadAdminPhoto: (file: File) => http.post<AdminProfileOut>("/auth/upload-admin-photo", photoForm(file)),
  deleteAdminPhoto: () => http.delete<AdminProfileOut>("/auth/delete-admin-photo"),
};