import { http } from "../http";
import type { AccessTokenOut, ChangePasswordIn, DeleteAccountIn, MessageOut, SessionOut } from "../types";

export const accountApi = {
  /** Troca a senha e devolve um novo access token (as demais sessões são encerradas pelo backend). */
  changePassword: (payload: ChangePasswordIn) => http.post<AccessTokenOut>("/auth/change-password", payload),

  sessions: (signal?: AbortSignal) => http.get<SessionOut[]>("/auth/sessions", { signal }),
  revokeSession: (sessionId: number) => http.delete<MessageOut>(`/auth/sessions/${sessionId}`),
  logoutAll: () => http.post<MessageOut>("/auth/logout-all"),

  /** LGPD: exporta os dados pessoais (JSON). */
  exportMyData: () => http.get<Record<string, unknown>>("/auth/export-my-data"),
  deleteAccount: (payload: DeleteAccountIn) => http.delete<MessageOut>("/auth/delete-account", { body: payload }),
};