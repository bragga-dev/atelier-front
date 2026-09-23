// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider } from "react-router/dom";
import { tokenStore } from "@/api/token-store";
import { AppProviders } from "@/app/providers";
import { createAppRouter } from "@/app/router";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const ME = {
  user: { user_id: "u1", email: "ana@example.com", role: "client", is_trusty: true, is_active: true, date_joined: "", created_at: "" },
  client: { client_id: "c1", first_name: "Ana", last_name: null, gender: "Outro", gender_label: "Outro", photo_url: null, username: null, phone: null, birth_date: null, cpf: null },
  admin: null,
};

const ADDRESS = {
  client: { client_id: "c1" },
  address_id: "addr-1",
  cep: "45200000",
  street: "Rua das Flores",
  number: "10",
  complement: "",
  neighborhood: "Centro",
  city: "Jequié",
  state: "BA",
  state_label: "Bahia",
  country: "Brasil",
  is_preferential: true,
};

const CART_ITEM = {
  cart_item_id: "ci1",
  product: { product_id: "p1", product_name: "Tapete de Crochê", categories: [], is_active: true, price: "100.00", stock: 5, description: "", in_stock: true, cover_image: null },
  quantity_item: 1,
  unit_price_item: "100.00",
  shipping_type: null,
  shipping_value: "0.00",
  subtotal: "100.00",
};
const CART = { cart_id: "cart-1", items: [CART_ITEM], total_price: "100.00", total_shipping: "0.00", total_geral: "100.00" };

function order(status: string) {
  return {
    order_id: "order-1",
    code: "PED-0001",
    order_status: status,
    order_status_label: status === "PENDING" ? "Aguardando pagamento" : status,
    items: [{ order_item_id: "oi1", product: CART_ITEM.product, order_item_quantity: 1, order_item_price: "100.00", subtotal: "100.00" }],
    subtotal: "100.00",
    order_shipping_total: "0.00",
    total_geral: "100.00",
    shipping_address_id: "addr-1",
    created_at: "2026-09-20T10:00:00Z",
    updated_at: "2026-09-20T10:00:00Z",
  };
}

const PAYMENT = {
  payment_id: "pay-1",
  order_id: "order-1",
  asaas_payment_id: "asaas-1",
  value: "100.00",
  billing_type: "PIX",
  status: "PENDING",
  due_date: "2026-09-23",
  description: "Pedido PED-0001",
  invoice_url: "https://asaas.example/invoice/1",
  bank_slip_url: null,
  pix_qr_code: "iVBORw0KGgo=",
  pix_copy_paste: "00020126...copiaecola",
  payment_date: null,
  net_value: null,
  created_at: "2026-09-20T10:05:00Z",
};

function mockApi(handler: (path: string, init: RequestInit) => Response | undefined) {
  const calls: { method: string; path: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = url.replace("http://localhost:8000/api", "").split("?")[0]!;
      calls.push({ method: init.method ?? "GET", path });
      if (path === "/auth/refresh") return json(200, { access: "tok" });
      if (path === "/auth/me") return json(200, ME);
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
  vi.stubGlobal("clipboard", { writeText: vi.fn() });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("checkout (Fase 5)", () => {
  it("confirma o pedido com o endereço preferencial e gera cobrança PIX na tela do pedido", async () => {
    let createdOrder = false;
    let paymentCreated = false;

    mockApi((path, init) => {
      if (path === "/cart/") return json(200, CART);
      if (path === "/address/my-addresses") return json(200, [ADDRESS]);
      if (path === "/orders/" && init.method === "POST") {
        createdOrder = true;
        return json(201, order("PENDING"));
      }
      if (path === "/orders/order-1" && (init.method ?? "GET") === "GET") return json(200, order("PENDING"));
      if (path === "/orders/order-1/payments" && (init.method ?? "GET") === "GET") {
        return json(200, paymentCreated ? [PAYMENT] : []);
      }
      if (path === "/orders/order-1/payments" && init.method === "POST") {
        paymentCreated = true;
        return json(201, PAYMENT);
      }
    });

    const router = await boot("/checkout");
    // Endereço preferencial já vem pré-selecionado.
    expect(await screen.findByText(/Rua das Flores, 10/)).toBeTruthy();

    await userEvent.click(await screen.findByRole("button", { name: "Confirmar pedido" }));
    await waitFor(() => expect(createdOrder).toBe(true));
    await waitFor(() => expect(router.state.location.pathname).toBe("/painel/meus-pedidos/order-1"));
    expect(await screen.findByRole("heading", { name: "Pedido PED-0001" })).toBeTruthy();

    await userEvent.click(await screen.findByRole("button", { name: "Pagar com Pix" }));
    await waitFor(() => expect(paymentCreated).toBe(true));
    expect(await screen.findByAltText("QR Code Pix")).toBeTruthy();
    expect(screen.getByDisplayValue("00020126...copiaecola")).toBeTruthy();
  });

  it("sem itens no carrinho: manda para o catálogo em vez de mostrar o formulário de endereço", async () => {
    mockApi((path) => {
      if (path === "/cart/") return json(200, { ...CART, items: [], total_price: "0.00", total_geral: "0.00" });
      if (path === "/address/my-addresses") return json(200, []);
    });
    await boot("/checkout");
    expect(await screen.findByRole("heading", { name: "Seu carrinho está vazio" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver produtos" }).getAttribute("href")).toBe("/produtos");
  });
});