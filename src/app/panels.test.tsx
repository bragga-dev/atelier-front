// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "@/api/token-store";
import { ADMIN_ME, bootApp, CLIENT_ME, json, mockApi } from "./test-utils";

beforeEach(() => {
  tokenStore.clear();
  vi.stubGlobal("scrollTo", () => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const page = (items: unknown[] = []) => ({ items, total: items.length, page: 1, page_size: 20, pages: items.length ? 1 : 0 });

const ORDER = {
  order_id: "o1", code: "LF-1001", order_status: "COMPLETED", order_status_label: "Pago",
  total_geral: "249.90", subtotal: "219.90", order_shipping_total: "30.00", items: [],
  shipping_service_code: "04510", shipping_status: "pending", shipping_status_label: "Aguardando etiqueta",
  shipping_tracking_code: null, shipped_at: null, created_at: "2026-10-01T12:00:00Z", updated_at: "2026-10-01T12:00:00Z",
  customer_name: "Maria Silva", customer_email: "maria@example.com",
  shipping_address_summary: "Rua A, 10 — Centro, Jequié/BA — CEP 45200000",
  frenet_order_id: null, shipping_label_url: null, completed_at: null,
};

describe("guards por perfil", () => {
  it("cliente que abre /admin volta para o painel dele", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /orders/": [] } });
    const router = await bootApp("/admin");
    await waitFor(() => expect(router.state.location.pathname).toBe("/painel"));
  });

  it("admin que abre /painel vai para o painel administrativo", async () => {
    mockApi({ me: ADMIN_ME, handlers: { "GET /admin/dashboard/summary": { total_orders: 0, total_revenue: "0", average_ticket: "0", top_products: [], top_categories: [], low_stock_products: [] } } });
    const router = await bootApp("/painel");
    await waitFor(() => expect(router.state.location.pathname).toBe("/admin"));
  });

  it("anônimo é mandado ao login e volta depois (next)", async () => {
    mockApi({ me: null });
    const router = await bootApp("/painel/perfil");
    await waitFor(() => expect(router.state.location.pathname).toBe("/entrar"));
    expect(router.state.location.search).toContain("next=%2Fpainel%2Fperfil");
  });

  it("atalhos /chat e /notificacoes levam ao painel", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /chat/conversations/mine": [], "GET /notifications/": page() } });
    const router = await bootApp("/notificacoes");
    await waitFor(() => expect(router.state.location.pathname).toBe("/painel/notificacoes"));
  });
});

describe("avatar / foto do usuário", () => {
  it("mostra a foto do cliente no menu e o painel admin no menu do admin", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /orders/": [] } });
    await bootApp("/painel");
    const imgs = await screen.findAllByAltText(/Foto de Ana Souza/i);
    expect(imgs[0]!.getAttribute("src")).toBe("https://cdn.test/ana.jpg");
  });

  it("sem foto cai nas iniciais", async () => {
    mockApi({ me: { ...CLIENT_ME, client: { ...CLIENT_ME.client, photo_url: null } }, handlers: { "GET /orders/": [] } });
    await bootApp("/painel");
    expect((await screen.findAllByText("AS")).length).toBeGreaterThan(0);
  });
});

describe("painel do cliente", () => {
  it("salva o perfil e envia só os campos preenchidos", async () => {
    const api = mockApi({
      me: CLIENT_ME,
      handlers: { "PATCH /auth/update-client-profile": () => json(200, { ...CLIENT_ME.client, last_name: "Lima" }) },
    });
    await bootApp("/painel/perfil");
    const last = await screen.findByLabelText("Sobrenome");
    fireEvent.change(last, { target: { value: "Lima" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));
    await waitFor(() => expect(api.calls.some((c) => c.method === "PATCH")).toBe(true));
    const body = api.calls.find((c) => c.method === "PATCH")!.body as Record<string, unknown>;
    expect(body).toMatchObject({ first_name: "Ana", last_name: "Lima", gender: "Outro" });
    expect(body).not.toHaveProperty("cpf");
    expect(body).not.toHaveProperty("phone");
  });

  it("recusa foto que não é imagem sem chamar a API", async () => {
    const api = mockApi({ me: CLIENT_ME });
    await bootApp("/painel/perfil");
    const input = (await screen.findByLabelText(/trocar foto|enviar foto/i, { selector: "input" })) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "doc.pdf", { type: "application/pdf" })] } });
    expect(await screen.findByText(/JPG, PNG ou WebP/i, { selector: "[role=alert], div" })).toBeTruthy();
    expect(api.calls.some((c) => c.path === "/auth/upload-client-photo")).toBe(false);
  });

  it("troca de senha exige confirmação igual e mostra erro de senha atual", async () => {
    const api = mockApi({ me: CLIENT_ME, handlers: { "GET /auth/sessions": [], "POST /auth/change-password": () => json(400, { detail: "Senha atual incorreta." }) } });
    await bootApp("/painel/seguranca");
    fireEvent.change(await screen.findByLabelText("Senha atual"), { target: { value: "errada123" } });
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "NovaSenha!2026" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "Diferente!2026" } });
    fireEvent.click(screen.getByRole("button", { name: /alterar senha/i }));
    expect(await screen.findByText("As senhas não conferem.")).toBeTruthy();
    expect(api.calls.some((c) => c.path === "/auth/change-password")).toBe(false);

    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "NovaSenha!2026" } });
    fireEvent.click(screen.getByRole("button", { name: /alterar senha/i }));
    expect(await screen.findByText("Senha atual incorreta.")).toBeTruthy();
  });

  it("lista notificações e marca todas como lidas", async () => {
    const api = mockApi({
      me: CLIENT_ME,
      handlers: {
        "GET /notifications/": page([{ notification_id: "n1", title: "Pedido pago", body: "Recebemos seu pagamento", is_read: false, created_at: "2026-10-01T12:00:00Z", action_url: "/painel/meus-pedidos/o1" }]),
        "POST /notifications/read-all": { updated: 1 },
      },
    });
    await bootApp("/painel/notificacoes");
    expect(await screen.findByText("Pedido pago")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /marcar tudo como lido/i }));
    await waitFor(() => expect(api.calls.some((c) => c.path === "/notifications/read-all")).toBe(true));
  });

  it("minhas avaliações vazias orienta a avaliar pelo pedido", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /reviews/me": [] } });
    await bootApp("/painel/avaliacoes");
    expect(await screen.findByText(/ainda não avaliou/i)).toBeTruthy();
  });
});

describe("painel administrativo", () => {
  it("lista pedidos com cliente e abre o detalhe", async () => {
    mockApi({ me: ADMIN_ME, handlers: { "GET /orders/admin/list": page([ORDER]), "GET /orders/admin/o1": ORDER } });
    await bootApp("/admin/pedidos");
    expect(await screen.findByText("Maria Silva")).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "LF-1001" }));
    expect(await screen.findByText("Pedido LF-1001")).toBeTruthy();
    expect(screen.getByRole("button", { name: /gerar etiqueta/i })).toBeTruthy();
  });

  it("gera etiqueta só após confirmar e mostra o erro de saldo da Frenet", async () => {
    const api = mockApi({
      me: ADMIN_ME,
      handlers: {
        "GET /orders/admin/o1": ORDER,
        "POST /orders/o1/generate-label": () => json(400, { detail: "Saldo insuficiente na carteira Frenet para gerar a etiqueta." }),
      },
    });
    await bootApp("/admin/pedidos/o1");
    fireEvent.click(await screen.findByRole("button", { name: /^gerar etiqueta$/i }));
    // Antes de confirmar, nenhuma cobrança
    expect(api.calls.some((c) => c.path === "/orders/o1/generate-label")).toBe(false);
    const dialog = await screen.findByRole("alertdialog").catch(() => screen.getByRole("dialog"));
    fireEvent.click(within(dialog).getByRole("button", { name: /gerar e pagar etiqueta/i }));
    expect(await screen.findByText(/Saldo insuficiente/i)).toBeTruthy();
  });

  it("pedido sem pagamento não oferece gerar etiqueta", async () => {
    mockApi({ me: ADMIN_ME, handlers: { "GET /orders/admin/o1": { ...ORDER, order_status: "PENDING", order_status_label: "Aguardando pagamento" } } });
    await bootApp("/admin/pedidos/o1");
    expect(await screen.findByText(/só pode ser gerada depois que o pagamento/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^gerar etiqueta$/i })).toBeNull();
  });

  it("dashboard mostra totais e estoque baixo", async () => {
    mockApi({
      me: ADMIN_ME,
      handlers: {
        "GET /admin/dashboard/summary": {
          total_orders: 3, total_revenue: "900.00", average_ticket: "300.00",
          top_products: [{ product_id: "p1", product_name: "Colar Aurora", quantity_sold: 4, revenue: "800.00" }],
          top_categories: [], low_stock_products: [{ product_id: "p2", product_name: "Brinco Lua", stock: 1 }],
        },
      },
    });
    await bootApp("/admin");
    expect(await screen.findByText("Colar Aurora")).toBeTruthy();
    expect(screen.getByText("Brinco Lua")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("moderação: publicar avaliação pendente chama a API", async () => {
    const review = { reviews_id: "r1", reviews: 5, comment: "Linda!", is_authorized: false, created_at: "2026-10-01T12:00:00Z", user: { email: "ana@example.com" }, order_item: { product: { product_name: "Colar Aurora" } } };
    const api = mockApi({ me: ADMIN_ME, handlers: { "GET /reviews/admin/pending": [review], "POST /reviews/admin/r1/authorize": { ...review, is_authorized: true } } });
    await bootApp("/admin/avaliacoes");
    fireEvent.click(await screen.findByRole("button", { name: /publicar/i }));
    await waitFor(() => expect(api.calls.some((c) => c.path === "/reviews/admin/r1/authorize")).toBe(true));
  });
});

/** O botão fica desabilitado até a lista "minhas avaliações" carregar; espera habilitar antes de clicar. */
async function openReviewForm() {
  const button = await screen.findByRole("button", { name: "Avaliar" });
  await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(button);
}

describe("avaliar peça pelo pedido pago", () => {
  const item = { order_item_id: "i1", product: { product_id: "p1", product_name: "Colar Aurora", cover_image: null }, order_item_quantity: 1, order_item_price: "199.90", subtotal: "199.90" };
  const paid = { ...ORDER, items: [item] };

  it("envia a avaliação com a nota escolhida e depois marca o item como avaliado", async () => {
    let reviews: unknown[] = [];
    const api = mockApi({
      me: CLIENT_ME,
      handlers: {
        "GET /orders/o1": paid,
        "GET /reviews/me": () => reviews,
        "POST /reviews/": () => { reviews = [{ reviews_id: "r1", order_item: item, reviews: 4, comment: "Linda", is_authorized: false, created_at: "2026-10-02T12:00:00Z", user: { email: "ana@example.com" } }]; return json(201, reviews[0]); },
      },
    });
    await bootApp("/painel/meus-pedidos/o1");
    await openReviewForm();
    fireEvent.click(screen.getByLabelText("4 estrelas"));
    fireEvent.change(screen.getByLabelText(/comentário/i), { target: { value: "Linda" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar avaliação/i }));

    await waitFor(() => expect(api.calls.some((c) => c.method === "POST" && c.path === "/reviews/")).toBe(true));
    expect(api.calls.find((c) => c.path === "/reviews/")!.body).toEqual({ order_item_id: "i1", reviews: 4, comment: "Linda" });
    expect(await screen.findByText("Avaliada")).toBeTruthy();
  });

  it("exige escolher a nota antes de enviar", async () => {
    const api = mockApi({ me: CLIENT_ME, handlers: { "GET /orders/o1": paid, "GET /reviews/me": [] } });
    await bootApp("/painel/meus-pedidos/o1");
    await openReviewForm();
    fireEvent.click(screen.getByRole("button", { name: /enviar avaliação/i }));
    expect(await screen.findByText(/escolha de 1 a 5 estrelas/i)).toBeTruthy();
    expect(api.calls.some((c) => c.path === "/reviews/")).toBe(false);
  });

  it("pedido não pago não mostra a avaliação", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /orders/o1": { ...paid, order_status: "PENDING", order_status_label: "Aguardando pagamento" } } });
    await bootApp("/painel/meus-pedidos/o1");
    await screen.findByText(/pedido LF-1001/i);
    expect(screen.queryByText(/avalie suas peças/i)).toBeNull();
  });
});