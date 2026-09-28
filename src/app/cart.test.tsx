// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider } from "react-router/dom";
import { tokenStore } from "@/api/token-store";
import { AppProviders } from "@/app/providers";
import { createAppRouter } from "@/app/router";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function product(extra: Record<string, unknown> = {}) {
  return {
    product_id: "p1",
    product_name: "Tapete de Crochê",
    categories: [],
    is_active: true,
    price: "199.90",
    stock: 5,
    description: "",
    in_stock: true,
    cover_image: null,
    ...extra,
  };
}

function cartItem(extra: Record<string, unknown> = {}) {
  return {
    cart_item_id: "ci1",
    product: product(),
    quantity_item: 2,
    unit_price_item: "199.90",
    shipping_type: null,
    shipping_value: "0",
    subtotal: "399.80",
    ...extra,
  };
}

function cart(items: object[] = [cartItem()]) {
  const total = items.reduce((sum, item) => sum + Number((item as { subtotal: string }).subtotal), 0);
  return { cart_id: "k1", items, total_price: total.toFixed(2), total_shipping: "0", total_geral: total.toFixed(2) };
}

const ME_CLIENT = {
  user: { user_id: "u1", email: "cliente@example.com", role: "client", is_trusty: true, is_active: true, date_joined: "", created_at: "" },
  client: { client_id: "c1", first_name: "Ana", last_name: null, gender: "Outro", gender_label: "Outro", photo_url: null, username: null, phone: null, birth_date: null, cpf: null },
  admin: null,
};

const ME_ADMIN = {
  user: { user_id: "u2", email: "admin@example.com", role: "admin", is_trusty: true, is_active: true, date_joined: "", created_at: "" },
  client: null,
  admin: { admin_id: "a1", full_name: "Admin", photo_url: null },
};

type Handler = (path: string, url: URL, init: RequestInit) => Response | undefined;

function mockApi(handler: Handler, opts: { authed?: boolean; me?: object } = {}) {
  const loggedIn = !!opts.authed;
  const calls: { path: string; method: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const u = new URL(url);
      const path = u.pathname.replace("/api", "");
      const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
      calls.push({ path, method: init.method ?? "GET", body });

      if (path === "/auth/refresh") return loggedIn ? json(200, { access: "tok" }) : json(401, { detail: "x" });
      if (path === "/auth/me") return loggedIn ? json(200, opts.me ?? ME_CLIENT) : json(401, { detail: "x" });
      if (path === "/campaigns/running") return json(200, []);
      if (path === "/categories/") return json(200, { items: [], total: 0, page: 1, page_size: 100, pages: 1 });
      if (path === "/notifications/unread-count") return json(200, { unread_count: 0 });

      return handler(path, u, init) ?? json(404, { detail: "nope" });
    }),
  );
  return calls;
}

async function boot(path: string) {
  window.history.pushState({}, "", path);
  const router = createAppRouter();
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return router;
}

beforeEach(() => {
  tokenStore.clear();
  vi.stubGlobal("scrollTo", () => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("/carrinho", () => {
  it("visitante anônimo é mandado para o login com next=", async () => {
    mockApi(() => undefined);
    const router = await boot("/carrinho");
    await screen.findByRole("heading", { name: "Bem-vindo de volta" });
    expect(router.state.location.pathname).toBe("/entrar");
    expect(router.state.location.search).toBe("?next=%2Fcarrinho");
  });

  it("conta administrativa não vê o carrinho e não chama a API", async () => {
    const calls = mockApi((path) => (path === "/cart/" ? json(200, cart([])) : undefined), { authed: true, me: ME_ADMIN });
    await boot("/carrinho");
    expect(await screen.findByText("Sem carrinho por aqui")).toBeTruthy();
    expect(screen.getByText("Contas administrativas não fazem compras na loja.")).toBeTruthy();
    expect(calls.some((c) => c.path === "/cart/")).toBe(false);
  });

  it("carrinho vazio mostra estado vazio com link para produtos", async () => {
    mockApi((path) => (path === "/cart/" ? json(200, cart([])) : undefined), { authed: true });
    await boot("/carrinho");
    expect(await screen.findByText("Seu carrinho está vazio")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver produtos" })).toBeTruthy();
  });

  it("lista os itens e o resumo, com a nota de frete quando ainda é zero", async () => {
    mockApi((path) => (path === "/cart/" ? json(200, cart()) : undefined), { authed: true });
    await boot("/carrinho");
    expect(await screen.findByText("Tapete de Crochê")).toBeTruthy();
    expect(screen.getAllByText("R$ 399,80")).toHaveLength(3); // linha do item + subtotal do resumo + total
    expect(screen.getByText("O frete é calculado no checkout.")).toBeTruthy();
  });

  it("alterar quantidade: agrupa cliques rápidos numa única chamada PATCH", async () => {
    let current = cart();
    const calls = mockApi((path, _url, init) => {
      if (path === "/cart/") return json(200, current);
      if (path === "/cart/items/ci1" && init.method === "PATCH") {
        const body = JSON.parse(init.body as string);
        current = cart([cartItem({ quantity_item: body.quantity_item, subtotal: (body.quantity_item * 199.9).toFixed(2) })]);
        return json(200, current);
      }
    }, { authed: true });
    await boot("/carrinho");
    await screen.findByText("Tapete de Crochê");

    await userEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await userEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));

    await waitFor(() => expect(calls.filter((c) => c.path === "/cart/items/ci1")).toHaveLength(1));
    expect(calls.find((c) => c.path === "/cart/items/ci1")?.body).toEqual({ quantity_item: 4 });
  });

  it("estoque insuficiente: a linha mostra o erro e a quantidade volta ao valor do servidor", async () => {
    mockApi((path, _url, init) => {
      if (path === "/cart/") return json(200, cart());
      if (path === "/cart/items/ci1" && init.method === "PATCH") return json(409, { detail: "Estoque insuficiente." });
    }, { authed: true });
    await boot("/carrinho");
    await screen.findByText("Tapete de Crochê");

    await userEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    expect(await screen.findByText("Estoque insuficiente.")).toBeTruthy();
    await waitFor(() => expect((screen.getByLabelText("Quantidade") as HTMLInputElement).value).toBe("2"));
  });

  it("remover item chama DELETE e atualiza a lista", async () => {
    let current = cart();
    const calls = mockApi((path, _url, init) => {
      if (path === "/cart/") return json(200, current);
      if (path === "/cart/items/ci1" && init.method === "DELETE") {
        current = cart([]);
        return json(200, current);
      }
    }, { authed: true });
    await boot("/carrinho");
    await screen.findByText("Tapete de Crochê");

    await userEvent.click(screen.getByRole("button", { name: "Remover Tapete de Crochê do carrinho" }));
    expect(await screen.findByText("Seu carrinho está vazio")).toBeTruthy();
    expect(calls.some((c) => c.path === "/cart/items/ci1" && c.method === "DELETE")).toBe(true);
  });

  it("esvaziar carrinho: pede confirmação; cancelar não chama a API; confirmar esvazia", async () => {
    let current = cart();
    const calls = mockApi((path, _url, init) => {
      if (path === "/cart/" && init.method === "DELETE") {
        current = cart([]);
        return json(200, current);
      }
      if (path === "/cart/") return json(200, current);
    }, { authed: true });
    await boot("/carrinho");
    await screen.findByText("Tapete de Crochê");

    await userEvent.click(screen.getByRole("button", { name: "Esvaziar carrinho" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Esvaziar o carrinho?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(calls.some((c) => c.path === "/cart/" && c.method === "DELETE")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Esvaziar carrinho" }));
    await userEvent.click(screen.getByRole("button", { name: "Esvaziar" }));
    expect(await screen.findByText("Seu carrinho está vazio")).toBeTruthy();
  });

  it("um erro de render na página não derruba o header — dá pra navegar de volta", async () => {
    // item sem `product`: expõe qualquer regressão de shape sem quebrar a navegação inteira.
    mockApi((path) => (path === "/cart/" ? json(200, cart([{ ...cartItem(), product: undefined }])) : undefined), {
      authed: true,
    });
    await boot("/carrinho");
    expect(await screen.findByText("Algo deu errado")).toBeTruthy();
    // o header (fora do <Outlet>) continua funcionando
    expect(screen.getByRole("link", { name: "Sol e Arte — página inicial" })).toBeTruthy();
    await userEvent.click(screen.getByRole("link", { name: "Sol e Arte — página inicial" }));
    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
  });
});