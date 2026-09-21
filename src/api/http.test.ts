// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiErrorFromResponse, ApiError, toUserMessage } from "@/api/errors";
import { http } from "@/api/http";
import { setSessionLostHandler } from "@/api/session";
import { tokenStore } from "@/api/token-store";
import { safeInternalPath } from "@/lib/safe-redirect";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  tokenStore.clear();
  setSessionLostHandler(null);
  vi.restoreAllMocks();
});

describe("errors (payloads reais do backend)", () => {
  it("422 senha fraca vira erro no campo password, sem 'Value error,'", async () => {
    const err = await apiErrorFromResponse(
      json(422, { detail: [{ type: "value_error", loc: ["body", "payload", "password"], msg: "Value error, Esta senha é muito comum., Esta senha é inteiramente numérica.", ctx: {} }] }),
    );
    expect(err.fieldErrors.password).toBe("Esta senha é muito comum., Esta senha é inteiramente numérica.");
  });
  it("422 e-mail inválido é traduzido", async () => {
    const err = await apiErrorFromResponse(
      json(422, { detail: [{ type: "value_error", loc: ["body", "payload", "email"], msg: "value is not a valid email address: An email address must have an @-sign." }] }),
    );
    expect(err.fieldErrors.email).toBe("Informe um e-mail válido.");
  });
  it("422 de model (senhas diferentes) cai em _form", async () => {
    const err = await apiErrorFromResponse(json(422, { detail: [{ type: "value_error", loc: ["body", "payload"], msg: "Value error, As senhas não coincidem." }] }));
    expect(err.fieldErrors._form).toBe("As senhas não coincidem.");
  });
  it("409/401/403 usam o detail do backend; 500 não vaza detalhe; HTML não quebra", async () => {
    expect(toUserMessage(await apiErrorFromResponse(json(409, { detail: "Já existe um usuário com este e-mail." })))).toBe("Já existe um usuário com este e-mail.");
    expect(toUserMessage(await apiErrorFromResponse(json(500, { detail: "Erro interno do servidor.", exception: "boom" })))).toMatch(/do nosso lado/);
    const html = await apiErrorFromResponse(new Response("<html>502</html>", { status: 502 }));
    expect(html.status).toBe(502);
    expect(toUserMessage(html)).toMatch(/do nosso lado/);
  });
  it("rede e timeout", () => {
    expect(toUserMessage(new ApiError({ kind: "network", status: 0, message: "x" }))).toMatch(/conectar/);
    expect(toUserMessage(new ApiError({ kind: "timeout", status: 0, message: "x" }))).toMatch(/demorou/);
  });
});

describe("http client + refresh", () => {
  it("401 → refresh → repete a requisição com o token novo", async () => {
    tokenStore.set("velho");
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      calls.push(`${init.method} ${url} ${(init.headers as Record<string, string>).Authorization ?? "-"}`);
      if (url.endsWith("/auth/refresh")) return json(200, { access: "novo" });
      return (init.headers as Record<string, string>).Authorization === "Bearer novo" ? json(200, { ok: true }) : json(401, { detail: "expirou" });
    }));
    await expect(http.get("/cart/")).resolves.toEqual({ ok: true });
    expect(tokenStore.get()).toBe("novo");
    expect(calls).toHaveLength(3);
    expect(calls[1]).toContain("/auth/refresh");
  });

  it("várias requisições com 401 ao mesmo tempo disparam UM refresh só (rotação do backend)", async () => {
    tokenStore.set("velho");
    let refreshes = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) { refreshes++; await new Promise((r) => setTimeout(r, 20)); return json(200, { access: "novo" }); }
      return (init.headers as Record<string, string>).Authorization === "Bearer novo" ? json(200, { ok: 1 }) : json(401, { detail: "x" });
    }));
    await Promise.all([http.get("/cart/"), http.get("/orders/"), http.get("/notifications/unread-count")]);
    expect(refreshes).toBe(1);
  });

  it("refresh recusado (401) → sessão perdida + erro original", async () => {
    tokenStore.set("velho");
    const lost = vi.fn();
    setSessionLostHandler(lost);
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      url.endsWith("/auth/refresh") ? json(401, { detail: "Sessão expirada. Faça login novamente." }) : json(401, { detail: "Credenciais inválidas ou token expirado." })));
    await expect(http.get("/cart/")).rejects.toMatchObject({ status: 401 });
    expect(lost).toHaveBeenCalledTimes(1);
    expect(tokenStore.get()).toBeNull();
  });

  it("refresh com a API fora do ar NÃO derruba a sessão", async () => {
    tokenStore.set("velho");
    const lost = vi.fn();
    setSessionLostHandler(lost);
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/auth/refresh")) throw new TypeError("Failed to fetch");
      return json(401, { detail: "x" });
    }));
    await expect(http.get("/cart/")).rejects.toMatchObject({ kind: "network" });
    expect(lost).not.toHaveBeenCalled();
    expect(tokenStore.get()).toBe("velho");
  });

  it("login com 401 (senha errada) não tenta refresh", async () => {
    const f = vi.fn(async () => json(401, { detail: "E-mail ou senha inválidos." }));
    vi.stubGlobal("fetch", f);
    await expect(http.post("/auth/login", { email: "a", password: "b" }, { auth: false })).rejects.toMatchObject({ status: 401, detail: "E-mail ou senha inválidos." });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("só envia credenciais (cookie) para /auth/*", async () => {
    const f = vi.fn(async () => json(200, {}));
    vi.stubGlobal("fetch", f);
    await http.get("/categories/", { auth: false });
    await http.post("/auth/logout");
    const creds = f.mock.calls.map((c) => (c as unknown as [string, RequestInit])[1].credentials);
    expect(creds).toEqual(["omit", "include"]);
  });
});

describe("safeInternalPath", () => {
  it("bloqueia open redirect", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/");
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("/\\evil.com")).toBe("/");
    expect(safeInternalPath("/carrinho?a=1")).toBe("/carrinho?a=1");
    expect(safeInternalPath(null)).toBe("/");
  });
});
