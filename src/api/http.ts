import { apiErrorFromResponse } from "./errors";
import { isSessionExpiredError, notifySessionLost, refreshAccessToken } from "./session";
import { tokenStore } from "./token-store";
import { buildUrl, fetchWithTimeout, type QueryParams } from "./transport";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  query?: QueryParams;
  /** Objeto (vira JSON) ou FormData (upload multipart). */
  body?: unknown;
  signal?: AbortSignal;
  /**
   * `false` = rota pública de auth (login, cadastro…): não envia Bearer e um 401
   * não dispara refresh (é só "credenciais inválidas").
   */
  auth?: boolean;
}

function execute(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const { method = "GET", query, body, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // o browser define o Content-Type com o boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  return fetchWithTimeout(
    buildUrl(path, query),
    {
      method,
      headers,
      body: payload,
      // O cookie do refresh só existe em /api/auth; nas demais rotas não enviamos credenciais.
      credentials: path.startsWith("/auth/") ? "include" : "omit",
    },
    signal,
  );
}

async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true } = options;

  let response = await execute(path, options, auth ? tokenStore.get() : null);

  if (response.status === 401 && auth) {
    let freshToken: string;
    try {
      freshToken = await refreshAccessToken();
    } catch (refreshError) {
      if (isSessionExpiredError(refreshError)) {
        const original = await apiErrorFromResponse(response);
        notifySessionLost();
        throw original;
      }
      throw refreshError; // rede/timeout: não derruba a sessão
    }
    response = await execute(path, options, freshToken);
  }

  if (!response.ok) throw await apiErrorFromResponse(response);
  return parseBody<T>(response);
}

export const http = {
  get: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
