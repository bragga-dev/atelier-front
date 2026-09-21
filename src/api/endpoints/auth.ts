import { http } from "../http";
import type {
  AccessTokenOut,
  LoginIn,
  MeOut,
  MessageOut,
  PasswordResetConfirmIn,
  PasswordResetRequestIn,
  RegisterIn,
} from "../types";

export const authApi = {
  login: (payload: LoginIn) => http.post<AccessTokenOut>("/auth/login", payload, { auth: false }),

  register: (payload: RegisterIn) =>
    http.post<AccessTokenOut>("/auth/register", payload, { auth: false }),

  me: (signal?: AbortSignal) => http.get<MeOut>("/auth/me", { signal }),

  logout: () => http.post<MessageOut>("/auth/logout"),

  requestPasswordReset: (payload: PasswordResetRequestIn) =>
    http.post<MessageOut>("/auth/password-reset/request", payload, { auth: false }),

  confirmPasswordReset: (payload: PasswordResetConfirmIn) =>
    http.post<MessageOut>("/auth/password-reset/confirm", payload, { auth: false }),

  /** O backend recebe o e-mail como query param (POST sem corpo). */
  resendVerification: (email: string) =>
    http.post<MessageOut>("/auth/resend-verification", undefined, {
      auth: false,
      query: { email },
    }),
};
