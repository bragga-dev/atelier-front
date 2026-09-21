import type { AccessTokenOut } from "./types";
import { ApiError, apiErrorFromResponse } from "./errors";
import { tokenStore } from "./token-store";
import { buildUrl, fetchWithTimeout } from "./transport";

/**
 * O backend ROTACIONA o refresh token a cada uso e blacklista o anterior. Duas chamadas
 * concorrentes ao /auth/refresh fazem a segunda falhar (token já usado) e derrubariam a
 * sessão — por isso:
 *  1. dentro da aba, todas as chamadas compartilham a mesma promise (single-flight)
 *     — isso também cobre o double-effect do React.StrictMode em desenvolvimento;
 *  2. entre abas, usamos Web Locks para serializar (cada aba usa o cookie mais novo).
 */
const REFRESH_LOCK_NAME = "sol-e-arte:refresh";

async function performRefresh(): Promise<string> {
  const response = await fetchWithTimeout(buildUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include", // envia o cookie httpOnly com o refresh token
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw await apiErrorFromResponse(response);

  const data = (await response.json()) as AccessTokenOut;
  tokenStore.set(data.access);
  return data.access;
}

async function runRefresh(): Promise<string> {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return await navigator.locks.request(REFRESH_LOCK_NAME, performRefresh);
  }
  return performRefresh();
}

let inflight: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!inflight) {
    inflight = runRefresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

type SessionLostHandler = () => void;
let sessionLostHandler: SessionLostHandler | null = null;

/** O AuthProvider registra aqui o que fazer quando o refresh falha (sessão perdida). */
export function setSessionLostHandler(handler: SessionLostHandler | null): void {
  sessionLostHandler = handler;
}

export function notifySessionLost(): void {
  tokenStore.clear();
  sessionLostHandler?.();
}

/** Só uma resposta 401 do refresh significa "sessão acabou"; rede fora do ar não. */
export function isSessionExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
