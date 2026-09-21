import { env } from "@/lib/env";
import { ApiError } from "./errors";

export const REQUEST_TIMEOUT_MS = 20_000;

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export function buildUrl(path: string, query?: QueryParams): string {
  const url = `${env.apiUrl}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * fetch com timeout. Diferencia:
 *  - cancelamento deliberado (signal externo, ex.: TanStack Query) → repassa o AbortError;
 *  - timeout → ApiError("timeout");
 *  - falha de rede → ApiError("network").
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new ApiError({ kind: "timeout", status: 0, message: "Request timeout" });
    }
    if (externalSignal?.aborted) throw error;
    throw new ApiError({ kind: "network", status: 0, message: "Network error" });
  } finally {
    window.clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}
