// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "@/app/providers";
import { createAppRouter } from "@/app/router";
import { tokenStore } from "@/api/token-store";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const ME = {
  user: { user_id: "u1", email: "ana@example.com", role: "client", is_trusty: true, is_active: true, date_joined: "", created_at: "" },
  client: { client_id: "c1", first_name: "Ana", last_name: null, gender: "Outro", gender_label: "Outro", photo_url: null, username: null, phone: null, birth_date: null, cpf: null },
  admin: null,
};
const CATEGORIES = { items: [
  { product_category_id: "cat-1", category_name: "Crochê", category_image_url: "http://x/y.jpg", is_active: true },
  { product_category_id: "cat-2", category_name: "Cerâmica", category_image_url: "http://x/z.jpg", is_active: true },
], total: 2, page: 1, page_size: 100, pages: 1 };

let loggedIn = false;
function mockApi(opts: { authed?: boolean } = {}) {
  loggedIn = !!opts.authed;
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    const path = url.replace("http://localhost:8000/api", "").split("?")[0]!;
    calls.push(`${init.method} ${path}`);
    if (path === "/auth/refresh") return loggedIn ? json(200, { access: "tok" }) : json(401, { detail: "Sessão expirada. Faça login novamente." });
    if (path === "/auth/login") { loggedIn = true; return json(200, { access: "tok" }); }
    if (path === "/auth/me") return loggedIn ? json(200, ME) : json(401, { detail: "x" });
    if (path === "/categories/") return json(200, CATEGORIES);
    if (path === "/cart/") return json(200, { cart_id: "k", items: [{ quantity_item: 2 }, { quantity_item: 3 }], total_price: "0", total_shipping: "0", total_geral: "0" });
    if (path === "/notifications/unread-count") return json(200, { unread_count: 7 });
    if (path === "/auth/logout") return json(200, { detail: "ok" });
    return json(404, { detail: "nope" });
  }));
  return calls;
}

async function boot(path: string) {
  window.history.pushState({}, "", path);
  const router = createAppRouter();
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return router;
}

beforeEach(() => { tokenStore.clear(); vi.stubGlobal("scrollTo", () => {}); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("app (jsdom, API simulada com os payloads reais)", () => {
  it("anônimo: home com navbar (Início, Categorias, Produtos, Contato, Entrar / Cadastrar) e ícones", async () => {
    mockApi();
    await boot("/");
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toMatch(/Peças feitas à mão/);
    const nav = screen.getAllByRole("navigation", { name: "Principal" })[0]!;
    for (const label of ["Início", "Categorias", "Produtos", "Contato"]) expect(within(nav).getByText(label)).toBeTruthy();
    expect(await screen.findByRole("link", { name: "Entrar / Cadastrar" })).toBeTruthy();
    for (const label of ["Carrinho", "Notificações", "Chat com a loja", "Entrar ou cadastrar"]) expect(screen.getByLabelText(label)).toBeTruthy();
  });

  it("menu Categorias busca na API só ao abrir e lista as categorias com link de filtro", async () => {
    const calls = mockApi();
    await boot("/");
    await screen.findByRole("heading", { level: 1 });
    expect(calls).not.toContain("GET /categories/");
    await userEvent.click(screen.getByRole("button", { name: /Categorias/ }));
    const link = await screen.findByRole("link", { name: /Crochê/ });
    expect(link.getAttribute("href")).toBe("/produtos?categoria=cat-1");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("link", { name: /Crochê/ })).toBeNull());
  });

  it("rota protegida sem sessão vai para /entrar?next=", async () => {
    mockApi();
    const router = await boot("/carrinho");
    await screen.findByRole("heading", { name: "Bem-vindo de volta" });
    expect(router.state.location.pathname).toBe("/entrar");
    expect(router.state.location.search).toBe("?next=%2Fcarrinho");
  });

  it("login: valida campos vazios; depois autentica e volta para o next, com badges do carrinho e do sino", async () => {
    mockApi();
    const router = await boot("/entrar?next=%2Fcarrinho");
    await screen.findByRole("heading", { name: "Bem-vindo de volta" });
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Informe seu e-mail.")).toBeTruthy();
    expect(screen.getByText("Informe sua senha.")).toBeTruthy();

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "Abcdef123!zz");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/carrinho"));
    expect(await screen.findByLabelText("Carrinho (5)")).toBeTruthy();
    expect(await screen.findByLabelText("Notificações (7)")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Entrar / Cadastrar" })).toBeNull();
  });

  it("sessão restaurada pelo cookie: já abre logado (refresh → me)", async () => {
    mockApi({ authed: true });
    await boot("/");
    expect(await screen.findByLabelText("Menu da minha conta")).toBeTruthy();
    await userEvent.click(screen.getByLabelText("Menu da minha conta"));
    expect(await screen.findByText("Ana")).toBeTruthy();
    expect(screen.getByText("ana@example.com")).toBeTruthy();
  });

  it("login com e-mail não verificado (403) mostra aviso e botão de reenvio", async () => {
    mockApi();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      const path = String(url).replace("http://localhost:8000/api", "").split("?")[0];
      if (path === "/auth/refresh") return json(401, { detail: "x" });
      if (path === "/auth/login") return json(403, { detail: "E-mail não verificado." });
      return json(404, {});
    });
    await boot("/entrar");
    await userEvent.type(await screen.findByLabelText("E-mail"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "qualquer1");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("E-mail não verificado.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reenviar e-mail de confirmação/ })).toBeTruthy();
  });

  it("cadastro: senhas diferentes bloqueiam no cliente; sucesso leva a /verifique-seu-email", async () => {
    const calls = mockApi();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string, init: RequestInit) => {
      const path = String(url).replace("http://localhost:8000/api", "").split("?")[0];
      calls.push(`${init.method} ${path}`);
      if (path === "/auth/refresh") return json(401, { detail: "x" });
      if (path === "/auth/register") return json(201, { access: "nao-deve-ser-usado" });
      return json(404, {});
    });
    const router = await boot("/cadastro");
    await userEvent.type(await screen.findByLabelText("E-mail"), "nova@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "Abcdef123!zz");
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "outra-coisa1");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByText("As senhas não coincidem.")).toBeTruthy();
    expect(calls).not.toContain("POST /auth/register");

    await userEvent.clear(screen.getByLabelText("Confirmar senha"));
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "Abcdef123!zz");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/verifique-seu-email"));
    expect(router.state.location.search).toBe("?email=nova%40example.com");
    expect(tokenStore.get()).toBeNull();
    expect(await screen.findByText("nova@example.com")).toBeTruthy();
  });

  it("cadastro: 409 vira erro no campo e-mail; 422 de senha do Django vira erro no campo senha", async () => {
    mockApi();
    let n = 0;
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      const path = String(url).replace("http://localhost:8000/api", "").split("?")[0];
      if (path === "/auth/refresh") return json(401, { detail: "x" });
      if (path === "/auth/register") return n++ === 0
        ? json(409, { detail: "Já existe um usuário com este e-mail." })
        : json(422, { detail: [{ type: "value_error", loc: ["body", "payload", "password"], msg: "Value error, Esta senha é muito comum." }] });
      return json(404, {});
    });
    await boot("/cadastro");
    await userEvent.type(await screen.findByLabelText("E-mail"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Senha"), "Abcdef123!zz");
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "Abcdef123!zz");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByText("Já existe um usuário com este e-mail.")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByText("Esta senha é muito comum.")).toBeTruthy();
  });

  it("/verificacao-concluida e /redefinir-senha (rotas que o backend emite)", async () => {
    mockApi();
    await boot("/verificacao-concluida?status=success&email=a%40b.com");
    expect(await screen.findByRole("heading", { name: "E-mail confirmado!" })).toBeTruthy();
    expect(within(screen.getByRole("main")).getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/entrar?email=a%40b.com");
    cleanup();
    await boot("/redefinir-senha");
    expect(await screen.findByRole("heading", { name: "Link inválido" })).toBeTruthy();
  });

  it("rota inexistente e links legados do backend", async () => {
    mockApi();
    await boot("/nao-existe");
    expect(await screen.findByRole("heading", { name: "Página não encontrada" })).toBeTruthy();
    cleanup();
    const router = await boot("/comprar-mais");
    await waitFor(() => expect(router.state.location.pathname).toBe("/produtos"));
  });
});
