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

const PRODUCT_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const CAT_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_PRODUCT_ID = "aaaaaaaa-0000-4000-8000-000000000002";

const CATEGORY = { product_category_id: CAT_ID, category_name: "Crochê", category_image_url: "http://x/a.jpg", is_active: true };

function baseProduct(extra: Record<string, unknown> = {}) {
  return {
    product_id: PRODUCT_ID,
    product_name: "Tapete de Crochê Aspiral",
    categories: [CATEGORY],
    is_active: true,
    price: "199.90",
    stock: 5,
    description: "Feito à mão, ponto aspiral, 60cm de diâmetro.",
    in_stock: true,
    cover_image: { image_id: "i1", product_image_url: "http://x/cover.jpg", is_cover: true, display_order: 0 },
    images: [
      { image_id: "i2", product_image_url: "http://x/2.jpg", is_cover: false, display_order: 1 },
      { image_id: "i1", product_image_url: "http://x/cover.jpg", is_cover: true, display_order: 0 },
    ],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...extra,
  };
}

const REVIEW = {
  reviews_id: "r1",
  order_item: { order_item_id: "oi1", product: baseProduct(), order_item_quantity: 1, order_item_price: "199.90", subtotal: "199.90" },
  user: { user_id: "u9", email: "ana.souza@example.com", role: "client", is_trusty: true, is_active: true, date_joined: "", created_at: "" },
  reviews: 5,
  reviews_label: "Excelente",
  comment: "Chegou rápido e é lindo!",
  created_at: "2026-02-10T12:00:00Z",
};

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
  let loggedIn = !!opts.authed;
  const calls: { path: string; method: string; query: Record<string, string>; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const u = new URL(url);
      const path = u.pathname.replace("/api", "");
      const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
      calls.push({ path, method: init.method ?? "GET", query: Object.fromEntries(u.searchParams), body });

      if (path === "/auth/refresh") return loggedIn ? json(200, { access: "tok" }) : json(401, { detail: "x" });
      if (path === "/auth/login") { loggedIn = true; return json(200, { access: "tok" }); }
      if (path === "/auth/me") return loggedIn ? json(200, opts.me ?? ME_CLIENT) : json(401, { detail: "x" });
      if (path === "/campaigns/running") return json(200, []);
      if (path === "/categories/") return json(200, { items: [CATEGORY], total: 1, page: 1, page_size: 100, pages: 1 });
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

describe("/produtos/:id (página do produto)", () => {
  it("carrega pelo UUID, mostra a trilha, a galeria (capa primeiro) e canonicaliza a URL com o slug", async () => {
    mockApi((path) => {
      if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct());
      if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, []);
      if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "0", total_reviews: 0 });
      if (path === "/products/") return json(200, { items: [], total: 0, page: 1, page_size: 5, pages: 1 });
    });
    const router = await boot(`/produtos/${PRODUCT_ID}`);

    expect(await screen.findByRole("heading", { level: 1, name: "Tapete de Crochê Aspiral" })).toBeTruthy();
    const trail = screen.getByRole("navigation", { name: "Trilha de navegação" });
    expect(within(trail).getByRole("link", { name: "Início" })).toBeTruthy();
    expect(within(trail).getByRole("link", { name: "Crochê" })).toBeTruthy();
    expect(within(trail).getByText("Tapete de Crochê Aspiral")).toBeTruthy();

    const mainImage = screen.getByRole("img", { name: "Tapete de Crochê Aspiral" });
    expect(mainImage.getAttribute("src")).toBe("http://x/cover.jpg");

    await waitFor(() => expect(router.state.location.pathname).toBe(`/produtos/${PRODUCT_ID}/tapete-de-croche-aspiral`));
  });

  it("galeria: clicar numa miniatura troca a foto principal", async () => {
    mockApi((path) => {
      if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct());
      if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, []);
      if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "0", total_reviews: 0 });
      if (path === "/products/") return json(200, { items: [], total: 0, page: 1, page_size: 5, pages: 1 });
    });
    await boot(`/produtos/${PRODUCT_ID}`);
    await screen.findByRole("heading", { level: 1 });

    await userEvent.click(screen.getByRole("tab", { name: "Foto 2 de 2" }));
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Tapete de Crochê Aspiral" }).getAttribute("src")).toBe("http://x/2.jpg"),
    );
  });

  it("produto esgotado: some o seletor e o botão, mostra aviso", async () => {
    mockApi((path) => {
      if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct({ stock: 0, in_stock: false }));
      if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, []);
      if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "0", total_reviews: 0 });
      if (path === "/products/") return json(200, { items: [], total: 0, page: 1, page_size: 5, pages: 1 });
    });
    await boot(`/produtos/${PRODUCT_ID}`);
    expect(await screen.findByText("Produto esgotado no momento")).toBeTruthy();
    expect(screen.queryByLabelText("Quantidade")).toBeNull();
    expect(screen.queryByRole("button", { name: /Adicionar ao carrinho/ })).toBeNull();
  });

  it("visitante anônimo vê 'Entrar para comprar' apontando para o login com next=", async () => {
    mockApi((path) => {
      if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct());
      if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, []);
      if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "0", total_reviews: 0 });
      if (path === "/products/") return json(200, { items: [], total: 0, page: 1, page_size: 5, pages: 1 });
    });
    await boot(`/produtos/${PRODUCT_ID}`);
    const link = await screen.findByRole("link", { name: "Entrar para comprar" });
    expect(link.getAttribute("href")).toBe(
      `/entrar?next=%2Fprodutos%2F${PRODUCT_ID}%2Ftapete-de-croche-aspiral`,
    );
  });

  it("conta administrativa não vê o botão de compra", async () => {
    mockApi(
      (path) => {
        if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct());
        if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, []);
        if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "0", total_reviews: 0 });
        if (path === "/products/") return json(200, { items: [], total: 0, page: 1, page_size: 5, pages: 1 });
      },
      { authed: true, me: ME_ADMIN },
    );
    await boot(`/produtos/${PRODUCT_ID}`);
    expect(await screen.findByText("Esta conta é administrativa e não faz compras na loja.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Adicionar ao carrinho/ })).toBeNull();
  });

  it("cliente logado adiciona ao carrinho com a quantidade escolhida e vê confirmação", async () => {
    const calls = mockApi(
      (path) => {
        if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct());
        if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, []);
        if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "0", total_reviews: 0 });
        if (path === "/products/") return json(200, { items: [], total: 0, page: 1, page_size: 5, pages: 1 });
        if (path === "/cart/items")
          return json(201, { cart_id: "k1", items: [{ cart_item_id: "ci1", product: baseProduct(), quantity_item: 2, unit_price_item: "199.90", shipping_type: null, shipping_value: "0", subtotal: "399.80" }], total_price: "399.80", total_shipping: "0", total_geral: "399.80" });
      },
      { authed: true, me: ME_CLIENT },
    );
    await boot(`/produtos/${PRODUCT_ID}`);
    await screen.findByRole("heading", { level: 1 });

    await userEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    await userEvent.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));

    await waitFor(() => expect(screen.getByLabelText("Carrinho (2)")).toBeTruthy());
    const added = calls.find((c) => c.path === "/cart/items");
    expect(added?.body).toEqual({ product_id: PRODUCT_ID, quantity_item: 2 });
  });

  it("frete: CEP inválido não chama a API; CEP válido mostra as opções; sem frete cadastrado mostra aviso amigável", async () => {
    let shouldConfigureShipping = true;
    const calls = mockApi((path, _url, init) => {
      if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct());
      if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, []);
      if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "0", total_reviews: 0 });
      if (path === "/products/") return json(200, { items: [], total: 0, page: 1, page_size: 5, pages: 1 });
      if (path === `/shipping/quote/${PRODUCT_ID}`) {
        if (!shouldConfigureShipping) return json(404, { detail: "Frete não configurado para este produto." });
        const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
        expect(body).toEqual({ recipient_cep: "45200000", quantity: 1 });
        return json(200, [{ carrier: "Correios", service: "PAC", service_code: "04510", price: "24.90", delivery_time_days: 7, error: false, error_message: null }]);
      }
    });
    await boot(`/produtos/${PRODUCT_ID}`);
    await screen.findByRole("heading", { level: 1 });

    await userEvent.type(screen.getByLabelText("Calcular frete"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Calcular" }));
    expect(await screen.findByText("Informe um CEP com 8 dígitos.")).toBeTruthy();
    expect(calls.some((c) => c.path === `/shipping/quote/${PRODUCT_ID}`)).toBe(false);

    await userEvent.clear(screen.getByLabelText("Calcular frete"));
    await userEvent.type(screen.getByLabelText("Calcular frete"), "45200-000");
    await userEvent.click(screen.getByRole("button", { name: "Calcular" }));
    expect(await screen.findByText("Correios · PAC")).toBeTruthy();
    expect(screen.getByText("R$ 24,90")).toBeTruthy();

    shouldConfigureShipping = false;
    await userEvent.click(screen.getByRole("button", { name: "Calcular" }));
    expect(await screen.findByText("O frete deste produto ainda não está disponível para cálculo.")).toBeTruthy();
  });

  it("avaliações: resumo mascara o e-mail e nunca mostra o endereço completo", async () => {
    mockApi((path) => {
      if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct());
      if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, [REVIEW]);
      if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "5", total_reviews: 1 });
      if (path === "/products/") return json(200, { items: [], total: 0, page: 1, page_size: 5, pages: 1 });
    });
    await boot(`/produtos/${PRODUCT_ID}`);
    expect(await screen.findByText("Chegou rápido e é lindo!")).toBeTruthy();
    expect(screen.getByText("an*******@example.com")).toBeTruthy();
    expect(screen.queryByText("ana.souza@example.com")).toBeNull();
    expect(screen.getByText(/1 avaliação/)).toBeTruthy();
  });

  it("'mais desta categoria' exclui o produto atual e leva ao catálogo filtrado", async () => {
    mockApi((path, url) => {
      if (path === `/products/${PRODUCT_ID}`) return json(200, baseProduct());
      if (path === `/reviews/products/${PRODUCT_ID}`) return json(200, []);
      if (path === `/reviews/products/${PRODUCT_ID}/summary`) return json(200, { product_id: PRODUCT_ID, average_rating: "0", total_reviews: 0 });
      if (path === "/products/" && url.searchParams.get("product_category_id") === CAT_ID) {
        return json(200, {
          items: [baseProduct(), baseProduct({ product_id: OTHER_PRODUCT_ID, product_name: "Almofada de Crochê" })],
          total: 2, page: 1, page_size: 5, pages: 1,
        });
      }
    });
    await boot(`/produtos/${PRODUCT_ID}`);
    const relatedHeading = await screen.findByText("Mais em Crochê");
    const section = relatedHeading.closest("section")!;
    await waitFor(() => expect(within(section).getByText("Almofada de Crochê")).toBeTruthy());
    expect(within(section).queryByText("Tapete de Crochê Aspiral")).toBeNull();
  });

  it("produto inexistente (404) mostra estado vazio com link para o catálogo, sem 'tentar novamente'", async () => {
    mockApi((path) => {
      if (path === `/products/${PRODUCT_ID}`) return json(404, { detail: "Produto não encontrado." });
    });
    await boot(`/produtos/${PRODUCT_ID}`);
    expect(await screen.findByText("Produto não encontrado")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver todos os produtos" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Tentar novamente/ })).toBeNull();
  });
});