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

const CAT = { product_category_id: "cat-1", category_name: "Crochê", category_image_url: "http://x/a.jpg", is_active: true };

function product(n: number, extra: Record<string, unknown> = {}) {
  return {
    product_id: `aaaaaaaa-0000-4000-8000-${String(n).padStart(12, "0")}`,
    product_name: `Tapete de Crochê ${n}`,
    categories: [CAT],
    is_active: true,
    price: "100.00",
    stock: 5,
    description: "",
    in_stock: true,
    cover_image: { image_id: `i${n}`, product_image_url: `http://x/p${n}.jpg`, is_cover: true, display_order: 0 },
    ...extra,
  };
}

function cartItem(n: number, quantity: number, extra: Record<string, unknown> = {}) {
  const unit = 100;
  return {
    cart_item_id: `cart-item-${n}`,
    product: product(n, extra.product as Record<string, unknown>),
    quantity_item: quantity,
    unit_price_item: unit.toFixed(2),
    shipping_type: null,
    shipping_value: "0.00",
    subtotal: (unit * quantity).toFixed(2),
    ...extra,
  };
}

function cart(items: ReturnType<typeof cartItem>[], extra: Record<string, unknown> = {}) {
  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  return { cart_id: "cart-1", items, total_price: total.toFixed(2), total_shipping: "0.00", total_geral: total.toFixed(2), ...extra };
}

function me(role: "client" | "admin") {
  return {
    user: { user_id: "u1", email: "ana@example.com", role, is_trusty: true, is_active: true, date_joined: "", created_at: "" },
    client: role === "client" ? { client_id: "c1", first_name: "Ana", last_name: null, gender: "Outro", gender_label: "Outro", photo_url: null, username: null, phone: null, birth_date: null, cpf: null } : null,
    admin: role === "admin" ? { admin_id: "a1", full_name: "Admin", photo_url: null } : null,
  };
}

type Handler = (path: string, init: RequestInit) => Response | undefined;
function mockApi(role: "client" | "admin", handler: Handler) {
  const calls: { method: string; path: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = url.replace("http://localhost:8000/api", "").split("?")[0]!;
      calls.push({ method: init.method ?? "GET", path });
      if (path === "/auth/refresh") return json(200, { access: "tok" });
      if (path === "/auth/me") return json(200, me(role));
      return handler(path, init) ?? json(404, { detail: "nope" });
    }),
  );
  return calls;
}

async function boot(path: string) {
  window.history.pushState({}, "", path);
  const router = createAppRouter();
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
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

describe("carrinho (Fase 4)", () => {
  it("vazio: mostra estado vazio com link para o catálogo", async () => {
    mockApi("client", (path) => {
      if (path === "/cart/") return json(200, cart([]));
    });
    await boot("/carrinho");
    expect(await screen.findByRole("heading", { name: "Seu carrinho está vazio" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver produtos" }).getAttribute("href")).toBe("/produtos");
  });

  it("com itens: lista produtos, mostra subtotal/total e permite trocar a quantidade e remover", async () => {
    const item1 = cartItem(1, 2);
    const item2 = cartItem(2, 1);
    const calls = mockApi("client", (path, init) => {
      if (path === "/cart/") return json(200, cart([item1, item2]));
      if (path === "/cart/items/cart-item-1" && init.method === "PATCH") {
        const updated = cartItem(1, 3);
        return json(200, cart([updated, item2]));
      }
      if (path === "/cart/items/cart-item-2" && init.method === "DELETE") {
        return json(200, cart([item1]));
      }
    });

    await boot("/carrinho");
    expect(await screen.findByText("Tapete de Crochê 1")).toBeTruthy();
    expect(screen.getByText("Tapete de Crochê 2")).toBeTruthy();
    // total geral inicial: item1 (2x100) + item2 (1x100) = 300 (aparece no subtotal e no total do resumo)
    expect(screen.getAllByText("R$ 300,00").length).toBeGreaterThanOrEqual(2);

    // Aumenta a quantidade do primeiro item → dispara PATCH e atualiza o cache com a resposta do backend.
    const row1 = screen.getByText("Tapete de Crochê 1").closest("li")!;
    await userEvent.click(within(row1).getByRole("button", { name: "Aumentar quantidade" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PATCH" && c.path === "/cart/items/cart-item-1")).toBe(true));
    expect(await within(row1).findByText("R$ 300,00")).toBeTruthy();

    // Remove o segundo item → dispara DELETE e ele some da lista.
    const row2 = screen.getByText("Tapete de Crochê 2").closest("li")!;
    await userEvent.click(within(row2).getByRole("button", { name: /Remover Tapete de Crochê 2/ }));
    await waitFor(() => expect(screen.queryByText("Tapete de Crochê 2")).toBeNull());
    expect(calls.some((c) => c.method === "DELETE" && c.path === "/cart/items/cart-item-2")).toBe(true);
  });

  it("esvaziar carrinho: primeiro clique pede confirmação, segundo esvazia de fato", async () => {
    const item1 = cartItem(1, 1);
    mockApi("client", (path, init) => {
      if (path === "/cart/" && (init.method ?? "GET") === "GET") return json(200, cart([item1]));
      if (path === "/cart/" && init.method === "DELETE") return json(200, cart([]));
    });

    await boot("/carrinho");
    await screen.findByText("Tapete de Crochê 1");

    const clearButton = screen.getByRole("button", { name: "Esvaziar carrinho" });
    await userEvent.click(clearButton);
    expect(await screen.findByRole("button", { name: "Confirmar: esvaziar carrinho?" })).toBeTruthy();
    expect(screen.getByText("Tapete de Crochê 1")).toBeTruthy(); // ainda não esvaziou

    await userEvent.click(screen.getByRole("button", { name: "Confirmar: esvaziar carrinho?" }));
    expect(await screen.findByRole("heading", { name: "Seu carrinho está vazio" })).toBeTruthy();
  });

  it("conta administrativa: mostra aviso e não busca /cart/", async () => {
    const calls = mockApi("admin", () => undefined);
    await boot("/carrinho");
    expect(await screen.findByRole("heading", { name: "Conta administrativa" })).toBeTruthy();
    expect(calls.some((c) => c.path === "/cart/")).toBe(false);
  });
});