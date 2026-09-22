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

const CAT_A = "11111111-1111-4111-8111-111111111111";
const CAT_B = "22222222-2222-4222-8222-222222222222";
const CATEGORIES = {
  items: [
    { product_category_id: CAT_A, category_name: "Crochê", category_image_url: "http://x/a.jpg", is_active: true },
    { product_category_id: CAT_B, category_name: "Cerâmica", category_image_url: "http://x/b.jpg", is_active: true },
  ],
  total: 2, page: 1, page_size: 100, pages: 1,
};

function product(n: number, extra: Record<string, unknown> = {}) {
  return {
    product_id: `aaaaaaaa-0000-4000-8000-${String(n).padStart(12, "0")}`,
    product_name: `Tapete de Crochê ${n}`,
    categories: [CATEGORIES.items[0]],
    is_active: true, price: "199.90", stock: 5, description: "", in_stock: true,
    cover_image: { image_id: `i${n}`, product_image_url: `http://x/p${n}.jpg`, is_cover: true, display_order: 0 },
    ...extra,
  };
}
const page = (items: unknown[], p = 1, pages = 1, total = items.length) => ({ items, total, page: p, page_size: 12, pages });

type Handler = (path: string, query: URLSearchParams, init: RequestInit) => Response | undefined;
function mockApi(handler: Handler) {
  const calls: { path: string; query: Record<string, string> }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    const u = new URL(url);
    const path = u.pathname.replace("/api", "");
    calls.push({ path, query: Object.fromEntries(u.searchParams) });
    if (path === "/auth/refresh") return json(401, { detail: "x" });
    return handler(path, u.searchParams, init) ?? json(404, { detail: "nope" });
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

describe("home", () => {
  it("com campanhas: mostra o carrossel (capa primeiro), categorias e novidades", async () => {
    mockApi((path) => {
      if (path === "/campaigns/running") return json(200, [{ campaign_id: "c1", title: "Coleção Verão", description: null, is_active: true }]);
      if (path === "/campaigns/c1/images") return json(200, [
        { campaign_mage_id: "b2", campaign_id: "c1", image_url: "http://x/2.jpg", is_cover: false, display_order: 1 },
        { campaign_mage_id: "b1", campaign_id: "c1", image_url: "http://x/1.jpg", is_cover: true, display_order: 5 },
      ]);
      if (path === "/categories/") return json(200, CATEGORIES);
      if (path === "/products/") return json(200, page([product(1), product(2, { in_stock: false, stock: 0 })]));
    });
    await boot("/");
    const carousel = await screen.findByRole("region", { name: "Destaques da loja" });
    const imgs = within(carousel).getAllByAltText("Coleção Verão") as HTMLImageElement[];
    expect(imgs.map((i) => i.getAttribute("src"))).toEqual(["http://x/1.jpg", "http://x/2.jpg"]);
    expect(within(carousel).getByRole("button", { name: "Próximo banner" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Novidades" })).toBeTruthy();
    expect(screen.getByText("Tapete de Crochê 1")).toBeTruthy();
    expect(screen.getAllByText("R$ 199,90").length).toBeGreaterThan(0);
    expect(screen.getByText("Esgotado")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /Crochê/ }).some((l) => l.getAttribute("href") === `/produtos?categoria=${CAT_A}`)).toBe(true);
  });

  it("sem campanhas (ou campanhas com erro): cai no hero estático e a home continua inteira", async () => {
    mockApi((path) => {
      if (path === "/campaigns/running") return json(500, { detail: "boom" });
      if (path === "/categories/") return json(200, { items: [], total: 0, page: 1, page_size: 8, pages: 0 });
      if (path === "/products/") return json(200, page([]));
    });
    await boot("/");
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toMatch(/Peças feitas à mão/);
    expect(screen.queryByRole("heading", { name: "Novidades" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Categorias" })).toBeNull();
  });
});

describe("/produtos", () => {
  it("lê filtros da URL, chama a API com os parâmetros certos e monta paginação com links reais", async () => {
    const calls = mockApi((path) => {
      if (path === "/categories/") return json(200, CATEGORIES);
      if (path === "/products/") return json(200, page([product(1), product(2)], 2, 5, 50));
    });
    await boot(`/produtos?busca=croche&categoria=${CAT_A}&disponiveis=1&ordem=recentes&pagina=2`);
    await screen.findByText("Tapete de Crochê 1");
    const productCall = calls.find((c) => c.path === "/products/")!;
    expect(productCall.query).toMatchObject({ page: "2", page_size: "12", search: "croche", product_category_id: CAT_A, in_stock_only: "true", sort: "recent" });
    expect(screen.getByText("50 produtos encontrados")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Crochê");
    const nav = screen.getByRole("navigation", { name: "Paginação" });
    expect(within(nav).getByRole("link", { name: "Próxima página" }).getAttribute("href")).toContain("pagina=3");
    expect(within(nav).getByRole("link", { name: "Página anterior" }).getAttribute("href")).not.toContain("pagina");
    expect(within(nav).getByText("2", { selector: "[aria-current=page]" })).toBeTruthy();
    // pré-busca da próxima página
    await waitFor(() => expect(calls.some((c) => c.path === "/products/" && c.query.page === "3")).toBe(true));
  });

  it("busca com debounce: uma requisição só, URL atualizada e volta para a página 1", async () => {
    const calls = mockApi((path, q) => {
      if (path === "/categories/") return json(200, CATEGORIES);
      if (path === "/products/") return json(200, page([product(1)], Number(q.get("page")), 3, 30));
    });
    const router = await boot("/produtos?pagina=3");
    await screen.findByText("Tapete de Crochê 1");
    const before = calls.filter((c) => c.path === "/products/").length;
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar produtos" }), "cro");
    await waitFor(() => expect(router.state.location.search).toBe("?busca=cro"));
    // A URL muda antes do React Query disparar a nova busca — espera a chamada de verdade acontecer.
    // Só a página 1 importa aqui: a pré-busca da página seguinte (Fase 2) também carrega o termo
    // de busca, então contar "qualquer chamada com search" seria contar as duas de propósito.
    await waitFor(() => {
      expect(calls.filter((c) => c.path === "/products/" && c.query.search && c.query.page === "1")).toHaveLength(1);
    });
    const searches = calls.filter((c) => c.path === "/products/" && c.query.search && c.query.page === "1");
    expect(searches[0]!.query).toMatchObject({ search: "cro", page: "1" });
    expect(calls.filter((c) => c.path === "/products/").length).toBeGreaterThan(before);
  });

  it("selecionar categoria e 'somente disponíveis' atualiza a URL; chips e 'Limpar filtros' desfazem", async () => {
    mockApi((path) => {
      if (path === "/categories/") return json(200, CATEGORIES);
      if (path === "/products/") return json(200, page([product(1)]));
    });
    const router = await boot("/produtos");
    await screen.findByText("Tapete de Crochê 1");
    await userEvent.selectOptions(screen.getByLabelText("Categoria"), CAT_B);
    await waitFor(() => expect(router.state.location.search).toBe(`?categoria=${CAT_B}`));
    await userEvent.click(screen.getByLabelText("Somente disponíveis"));
    await waitFor(() => expect(router.state.location.search).toBe(`?categoria=${CAT_B}&disponiveis=1`));
    expect(await screen.findByRole("button", { name: "Remover filtro: Cerâmica" })).toBeTruthy();
    await userEvent.click(screen.getAllByRole("button", { name: "Limpar filtros" })[0]!);
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("UUID inválido em ?categoria= é ignorado (evita 422)", async () => {
    const calls = mockApi((path) => {
      if (path === "/categories/") return json(200, CATEGORIES);
      if (path === "/products/") return json(200, page([product(1)]));
    });
    await boot("/produtos?categoria=nao-e-uuid");
    await screen.findByText("Tapete de Crochê 1");
    expect(calls.find((c) => c.path === "/products/")!.query.product_category_id).toBeUndefined();
  });

  it("estado vazio com filtro oferece limpar; sem filtro mostra mensagem neutra", async () => {
    mockApi((path) => {
      if (path === "/categories/") return json(200, CATEGORIES);
      if (path === "/products/") return json(200, page([], 1, 0, 0));
    });
    await boot("/produtos?busca=xyz");
    expect(await screen.findByText("Nenhum produto encontrado")).toBeTruthy();
    cleanup();
    await boot("/produtos");
    expect(await screen.findByText("Ainda não há produtos por aqui")).toBeTruthy();
  });

  it("erro da API mostra mensagem amigável (sem detalhe técnico) e 'Tentar novamente' recarrega", async () => {
    let fail = true;
    mockApi((path) => {
      if (path === "/categories/") return json(200, CATEGORIES);
      if (path === "/products/") return fail ? json(500, { detail: "Erro interno do servidor.", exception: "Traceback..." }) : json(200, page([product(1)]));
    });
    await boot("/produtos");
    expect(await screen.findByText("Não foi possível carregar os produtos", {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByText(/do nosso lado/)).toBeTruthy();
    expect(screen.queryByText(/Traceback/)).toBeNull();
    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Tapete de Crochê 1")).toBeTruthy();
  }, 15000);

  it("página além do fim volta para a página 1", async () => {
    const router = await (async () => {
      mockApi((path, q) => {
        if (path === "/categories/") return json(200, CATEGORIES);
        if (path === "/products/") return Number(q.get("page")) > 1 ? json(200, page([], 99, 2, 20)) : json(200, page([product(1)], 1, 2, 20));
      });
      return boot("/produtos?pagina=99");
    })();
    await screen.findByText("Tapete de Crochê 1");
    expect(router.state.location.search).toBe("");
  });
});

describe("/categorias", () => {
  it("lista categorias com link para o catálogo filtrado", async () => {
    mockApi((path) => (path === "/categories/" ? json(200, CATEGORIES) : undefined));
    await boot("/categorias");
    const link = await screen.findByRole("link", { name: /Cerâmica/ });
    expect(link.getAttribute("href")).toBe(`/produtos?categoria=${CAT_B}`);
  });
});

describe("/contato", () => {
  const fill = async (over: Partial<Record<string, string>> = {}) => {
    const v = { "Nome completo": "Maria Souza", "E-mail": "maria@example.com", Telefone: "(73) 99999-9999", Assunto: "Encomenda", Mensagem: "Quero uma encomenda de tapetes.", ...over };
    for (const [label, value] of Object.entries(v)) {
      const el = await screen.findByLabelText(label);
      await userEvent.clear(el);
      if (value) await userEvent.type(el, value!);
    }
  };

  it("valida campos, envia e mostra confirmação", async () => {
    const calls = mockApi((path) => (path === "/contact/" ? json(201, { contact_id: "1" }) : undefined));
    await boot("/contato");
    await userEvent.click(await screen.findByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByText("Informe seu nome completo.")).toBeTruthy();
    expect(screen.getByText("Informe um telefone com DDD.")).toBeTruthy();
    expect(calls.some((c) => c.path === "/contact/")).toBe(false);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByRole("heading", { name: "Mensagem enviada!" })).toBeTruthy();
  });

  it("409 do backend (nome já usado) aparece como erro do formulário; 429 também", async () => {
    let n = 0;
    mockApi((path) => {
      if (path !== "/contact/") return undefined;
      return n++ === 0 ? json(409, { detail: "Já existe um contato com esse nome." }) : json(429, { detail: "Muitas requisições." });
    });
    await boot("/contato");
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByText("Já existe um contato com esse nome.")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByText("Muitas requisições.")).toBeTruthy();
  });
});