// Utilitários dos testes de integração (jsdom + fetch simulado com payloads no formato real da API).
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "@/app/providers";
import { createAppRouter } from "@/app/router";

export const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const API = "http://localhost:8000/api";

export const CLIENT_ME = {
  user: { user_id: "u1", email: "ana@example.com", role: "client", is_trusty: true, is_active: true, date_joined: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z" },
  client: { client_id: "c1", first_name: "Ana", last_name: "Souza", gender: "Outro", gender_label: "Outro", photo_url: "https://cdn.test/ana.jpg", username: null, phone: null, birth_date: null, cpf: null },
  admin: null,
};

export const ADMIN_ME = {
  user: { user_id: "a1", email: "admin@example.com", role: "admin", is_trusty: true, is_active: true, date_joined: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z" },
  client: null,
  admin: { admin_id: "ad1", full_name: "Lojista Admin", photo_url: null },
};

type Handler = (request: { path: string; method: string; body: unknown; query: URLSearchParams }) => Response | unknown;

/**
 * Simula a API. Chaves no formato "GET /orders/" (sem prefixo /api, sem query string).
 * Um valor que não seja `Response` vira 200 com JSON. Retorna as chamadas feitas.
 */
export function mockApi(options: { me?: unknown | null; /** começa anônimo mesmo com `me` definido */ anonymous?: boolean; handlers?: Record<string, Handler | unknown> }) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  let authed = options.me != null && !options.anonymous;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/^\/api/, "");
      const method = init.method ?? "GET";
      let body: unknown = init.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { /* corpo não-JSON */ }
      }
      calls.push({ method, path, body });

      const custom = options.handlers?.[`${method} ${path}`];
      if (custom !== undefined) {
        const result = typeof custom === "function" ? (custom as Handler)({ path, method, body, query: parsed.searchParams }) : custom;
        if (typeof result === "object" && result instanceof Response) return result;
        return json(200, result);
      }

      if (path === "/auth/refresh") return authed ? json(200, { access: "tok" }) : json(401, { detail: "Sessão expirada." });
      if (path === "/auth/me") return authed ? json(200, options.me) : json(401, { detail: "x" });
      if (path === "/auth/logout") { authed = false; return json(200, { detail: "ok" }); }
      if (path === "/notifications/unread-count") return json(200, { unread_count: 0 });
      if (path === "/cart/") return json(200, { cart_id: "k", items: [], total_price: "0", total_shipping: "0", total_geral: "0" });
      if (path === "/categories/") return json(200, { items: [], total: 0, page: 1, page_size: 100, pages: 0 });
      return json(404, { detail: `sem mock: ${method} ${path}` });
    }),
  );

  return {
    calls,
    /** Simula um login bem-sucedido por outro caminho (ex.: Google). */
    authenticate: () => { authed = true; },
  };
}

export async function bootApp(path: string) {
  window.history.pushState({}, "", path);
  const router = createAppRouter();
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return router;
}