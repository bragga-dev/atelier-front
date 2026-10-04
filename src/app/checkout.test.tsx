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

const CART = { cart_id: "k1", items: [cartItem()], total_price: "399.80", total_shipping: "0", total_geral: "399.80" };

const ADDRESS = {
  address_id: "addr1",
  cep: "45200000",
  street: "Rua das Flores",
  number: "100",
  complement: null,
  neighborhood: "Centro",
  city: "Jequié",
  state: "BA",
  country: "Brasil",
  is_preferential: true,
};

function orderFixture(extra: Record<string, unknown> = {}) {
  return {
    order_id: "o1",
    code: "PED-0001",
    order_status: "PENDING",
    order_status_label: "Aguardando pagamento",
    items: [{ order_item_id: "oi1", product: product(), order_item_quantity: 2, order_item_price: "199.90", subtotal: "399.80" }],
    subtotal: "399.80",
    order_shipping_total: "24.90",
    total_geral: "424.70",
    shipping_address_id: "addr1",
    shipping_service_code: "04510",
    created_at: "2026-03-10T10:00:00Z",
    updated_at: "2026-03-10T10:00:00Z",
    ...extra,
  };
}

function meClient(extra: Record<string, unknown> = {}) {
  return {
    user: { user_id: "u1", email: "cliente@example.com", role: "client", is_trusty: true, is_active: true, date_joined: "", created_at: "" },
    client: { client_id: "c1", first_name: "Ana", last_name: "Silva", gender: "Outro", gender_label: "Outro", photo_url: null, username: null, phone: null, birth_date: null, cpf: "39053344705", ...extra },
    admin: null,
  };
}

const ME_ADMIN = {
  user: { user_id: "u2", email: "admin@example.com", role: "admin", is_trusty: true, is_active: true, date_joined: "", created_at: "" },
  client: null,
  admin: { admin_id: "a1", full_name: "Admin", photo_url: null },
};

function shippingOption(extra: Record<string, unknown> = {}) {
  return { carrier: "Correios", service: "PAC", service_code: "04510", price: "24.90", delivery_time_days: 7, error: false, error_message: null, ...extra };
}

type Handler = (path: string, url: URL, init: RequestInit) => Response | undefined;

function mockApi(handler: Handler, opts: { me?: object | (() => object) } = {}) {
  const calls: { path: string; method: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const u = new URL(url);
      const path = u.pathname.replace("/api", "");
      const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
      calls.push({ path, method: init.method ?? "GET", body });

      if (path === "/auth/refresh") return json(200, { access: "tok" });
      if (path === "/auth/me") return json(200, typeof opts.me === "function" ? opts.me() : (opts.me ?? meClient()));
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

describe("/checkout", () => {
  it("conta administrativa não vê o checkout e não chama a API do carrinho", async () => {
    const calls = mockApi((path) => (path === "/cart/" ? json(200, CART) : undefined), { me: ME_ADMIN });
    await boot("/checkout");
    expect(await screen.findByText("Sem checkout por aqui")).toBeTruthy();
    expect(calls.some((c) => c.path === "/cart/")).toBe(false);
  });

  it("perfil incompleto (sem CPF) trava endereço e frete; salvar libera as próximas etapas", async () => {
    let me = meClient({ cpf: null, first_name: "" });
    mockApi(
      (path, _url, init) => {
        if (path === "/cart/") return json(200, CART);
        if (path === "/address/my-addresses") return json(200, [ADDRESS]);
        if (path === "/auth/update-client-profile" && init.method === "PATCH") {
          me = meClient();
          return json(200, me.client);
        }
      },
      { me: () => me },
    );

    await boot("/checkout");
    expect(await screen.findByText("Endereço de entrega")).toBeTruthy();
    // etapa 2 travada: não existe formulário nem lista de endereços na tela
    expect(screen.queryByLabelText("CEP")).toBeNull();

    await userEvent.type(screen.getByLabelText("Nome"), "Ana");
    await userEvent.type(screen.getByLabelText("Sobrenome"), "Silva");
    await userEvent.type(screen.getByLabelText("CPF"), "390.533.447-05");
    await userEvent.click(screen.getByRole("button", { name: "Salvar dados" }));

    await waitFor(() => expect(screen.getByText("Ana Silva")).toBeTruthy());
    expect(await screen.findByText(/Rua das Flores, 100/)).toBeTruthy();
  });

  it("sem endereço cadastrado, o formulário abre direto; cadastrar libera o frete", async () => {
    const calls = mockApi((path, _url, init) => {
      if (path === "/cart/") return json(200, CART);
      if (path === "/address/my-addresses" && init.method === "GET") return json(200, []);
      if (path === "/address/my-addresses" && init.method === "POST") return json(201, ADDRESS);
      if (path === `/shipping/quote/p1`) return json(200, [shippingOption()]);
    });
    await boot("/checkout");
    await screen.findByLabelText("CEP");

    await userEvent.type(screen.getByLabelText("CEP"), "45200-000");
    await userEvent.type(screen.getByLabelText("Rua"), "Rua Nova");
    await userEvent.type(screen.getByLabelText("Número"), "10");
    await userEvent.type(screen.getByLabelText("Bairro"), "Centro");
    await userEvent.type(screen.getByLabelText("Cidade"), "Jequié");
    await userEvent.selectOptions(screen.getByLabelText("Estado"), "BA");
    await userEvent.click(screen.getByRole("button", { name: "Salvar endereço" }));

    expect(await screen.findByText("Correios · PAC")).toBeTruthy();
    expect(calls.some((c) => c.path === "/address/my-addresses" && c.method === "POST")).toBe(true);
  });

  it("frete: soma o preço de todos os itens e usa o maior prazo entre eles", async () => {
    const cartTwoItems = {
      ...CART,
      items: [cartItem(), cartItem({ cart_item_id: "ci2", product: product({ product_id: "p2", product_name: "Almofada" }), quantity_item: 1, subtotal: "89.90" })],
    };
    mockApi((path, url) => {
      if (path === "/cart/") return json(200, cartTwoItems);
      if (path === "/address/my-addresses") return json(200, [ADDRESS]);
      if (path === "/shipping/quote/p1") return json(200, [shippingOption({ price: "20.00", delivery_time_days: 5 })]);
      if (path === "/shipping/quote/p2") return json(200, [shippingOption({ price: "15.00", delivery_time_days: 8 })]);
      void url;
    });
    await boot("/checkout");
    expect(await screen.findByText("Até 8 dias úteis")).toBeTruthy();
    expect(screen.getByText("R$ 35,00")).toBeTruthy(); // 20 + 15
  });

  it("confirmar pedido chama a API com o endereço e o serviço escolhidos, e vai para o pagamento", async () => {
    const calls = mockApi((path, _url, init) => {
      if (path === "/cart/") return json(200, CART);
      if (path === "/address/my-addresses") return json(200, [ADDRESS]);
      if (path === "/shipping/quote/p1") return json(200, [shippingOption()]);
      if (path === "/orders/" && init.method === "POST") return json(201, orderFixture());
    });
    const router = await boot("/checkout");
    await screen.findByText("Correios · PAC");
    await userEvent.click(screen.getByLabelText(/Correios · PAC/));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/painel/meus-pedidos/o1/pagamento"));
    const created = calls.find((c) => c.path === "/orders/" && c.method === "POST");
    expect(created?.body).toEqual({ shipping_address_id: "addr1", shipping_service_code: "04510" });
  });

  it("409 ao confirmar (conflito de estoque) mostra o erro com link para revisar o carrinho", async () => {
    mockApi((path, _url, init) => {
      if (path === "/cart/") return json(200, CART);
      if (path === "/address/my-addresses") return json(200, [ADDRESS]);
      if (path === "/shipping/quote/p1") return json(200, [shippingOption()]);
      if (path === "/orders/" && init.method === "POST") return json(409, { detail: "O estoque do produto mudou." });
    });
    await boot("/checkout");
    await screen.findByText("Correios · PAC");
    await userEvent.click(screen.getByLabelText(/Correios · PAC/));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    expect(await screen.findByText("O estoque do produto mudou.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Revisar o carrinho" })).toBeTruthy();
  });
});

describe("/painel/meus-pedidos/:id/pagamento", () => {
  it("Pix: mostra o QR code e copia o código", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    // A API de verdade devolveria a cobrança recém-criada no GET seguinte — o mock precisa fazer o mesmo,
    // senão o refetch disparado pela invalidação (orders.detail cascateia para orders.detail.*.payments)
    // sobrescreveria o pagamento criado com uma lista vazia.
    let paymentsList: object[] = [];
    const calls = mockApi((path, _url, init) => {
      if (path === "/orders/o1") return json(200, orderFixture());
      if (path === "/orders/o1/payments" && init.method === "GET") return json(200, paymentsList);
      if (path === "/orders/o1/payments" && init.method === "POST") {
        const created = {
          payment_id: "pay1", order_id: "o1", asaas_payment_id: "asaas1", value: "424.70", billing_type: "PIX",
          status: "PENDING", due_date: "2026-03-13", description: "Pedido PED-0001", invoice_url: "https://asaas.com/i/1",
          bank_slip_url: null, pix_qr_code: "aGVsbG8=", pix_copy_paste: "00020126chavepix", payment_date: null, net_value: null,
          created_at: "2026-03-10T10:05:00Z",
        };
        paymentsList = [created];
        return json(201, created);
      }
      if (path === "/address/my-addresses") return json(200, [ADDRESS]);
    });
    await boot("/painel/meus-pedidos/o1/pagamento");
    await screen.findByRole("heading", { name: "Como você quer pagar?" });
    await userEvent.click(screen.getByRole("button", { name: /Gerar cobrança/ }));

    const qr = await screen.findByAltText("QR Code para pagamento via Pix");
    expect(calls.find((c) => c.path === "/orders/o1/payments" && c.method === "POST")?.body).toEqual({ billing_type: "PIX" });
    expect(qr.getAttribute("src")).toBe("data:image/png;base64,aGVsbG8=");
    await userEvent.click(screen.getByRole("button", { name: "Copiar" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("00020126chavepix");
  });

  it("Boleto: mostra vencimento sem erro de fuso e o link do boleto", async () => {
    mockApi((path, _url, init) => {
      if (path === "/orders/o1") return json(200, orderFixture());
      if (path === "/orders/o1/payments" && init.method === "GET")
        return json(200, [
          { payment_id: "pay1", order_id: "o1", asaas_payment_id: "a1", value: "424.70", billing_type: "BOLETO", status: "PENDING", due_date: "2026-03-13", description: "x", invoice_url: "https://asaas.com/i/1", bank_slip_url: "https://asaas.com/b/1", pix_qr_code: null, pix_copy_paste: null, payment_date: null, net_value: null, created_at: "2026-03-10T10:05:00Z" },
        ]);
      if (path === "/address/my-addresses") return json(200, [ADDRESS]);
    });
    await boot("/painel/meus-pedidos/o1/pagamento");
    expect(await screen.findByText(/13 de março de 2026/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver boleto" }).getAttribute("href")).toBe("https://asaas.com/b/1");
  });

  it("cartão recusado: mostra o erro e limpa os campos sensíveis", async () => {
    mockApi((path, _url, init) => {
      if (path === "/orders/o1") return json(200, orderFixture());
      if (path === "/orders/o1/payments" && init.method === "GET") return json(200, []);
      if (path === "/orders/o1/payments" && init.method === "POST") return json(502, { detail: "Cartão recusado pela operadora." });
      if (path === "/address/my-addresses") return json(200, [ADDRESS]);
    });
    await boot("/painel/meus-pedidos/o1/pagamento");
    await userEvent.click(await screen.findByLabelText(/Cartão de crédito/));

    // Alguns campos já vêm preenchidos com os dados da conta/endereço — limpa antes de digitar,
    // senão o texto simplesmente emenda no valor padrão.
    const fillField = async (label: string, value: string) => {
      const field = screen.getByLabelText(label);
      await userEvent.clear(field);
      await userEvent.type(field, value);
    };

    await fillField("Número do cartão", "4111 1111 1111 1111");
    await fillField("Nome impresso no cartão", "ANA SILVA");
    await fillField("Validade", "1229");
    await fillField("Código de segurança", "123");
    await fillField("Nome completo", "Ana Silva");
    await fillField("E-mail", "ana@example.com");
    await fillField("CPF ou CNPJ", "390.533.447-05");
    await fillField("CEP do titular", "45200-000");
    await fillField("Número do endereço", "100");
    await userEvent.click(screen.getByRole("button", { name: /Pagar/ }));

    expect(await screen.findByText("Cartão recusado pela operadora.")).toBeTruthy();
    await waitFor(() => expect((screen.getByLabelText("Número do cartão") as HTMLInputElement).value).toBe(""));
    expect((screen.getByLabelText("Código de segurança") as HTMLInputElement).value).toBe("");
  });

  it("pagamento já confirmado mostra a tela de sucesso, sem seletor de método", async () => {
    mockApi((path) => {
      if (path === "/orders/o1") return json(200, orderFixture({ order_status: "COMPLETED", order_status_label: "Pago" }));
      if (path === "/orders/o1/payments")
        return json(200, [{ payment_id: "pay1", order_id: "o1", asaas_payment_id: "a1", value: "424.70", billing_type: "PIX", status: "RECEIVED", due_date: "2026-03-13", description: "x", invoice_url: null, bank_slip_url: null, pix_qr_code: null, pix_copy_paste: null, payment_date: "2026-03-10T10:10:00Z", net_value: "410.00", created_at: "2026-03-10T10:05:00Z" }]);
      if (path === "/address/my-addresses") return json(200, [ADDRESS]);
    });
    await boot("/painel/meus-pedidos/o1/pagamento");
    expect(await screen.findByText("Pagamento confirmado")).toBeTruthy();
    expect(screen.queryByText("Como você quer pagar?")).toBeNull();
  });
});

describe("/painel/meus-pedidos", () => {
  it("lista vazia convida a ver produtos", async () => {
    mockApi((path) => (path === "/orders/" ? json(200, []) : undefined));
    await boot("/painel/meus-pedidos");
    expect(await screen.findByText("Você ainda não fez nenhum pedido")).toBeTruthy();
  });

  it("lista um pedido e navega para o detalhe", async () => {
    mockApi((path) => {
      if (path === "/orders/") return json(200, [orderFixture()]);
      if (path === "/orders/o1") return json(200, orderFixture());
    });
    const router = await boot("/painel/meus-pedidos");
    await userEvent.click(await screen.findByText("Pedido PED-0001"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/painel/meus-pedidos/o1"));
  });

  it("pedido PENDING permite cancelar (com confirmação); pedido pago não mostra o botão", async () => {
    let status = "PENDING";
    const calls = mockApi((path, _url, init) => {
      if (path === "/orders/o1" && init.method === "POST") {
        status = "CANCELLED";
        return json(200, orderFixture({ order_status: "CANCELLED", order_status_label: "Cancelado" }));
      }
      if (path === "/orders/o1/cancel") {
        status = "CANCELLED";
        return json(200, orderFixture({ order_status: "CANCELLED", order_status_label: "Cancelado" }));
      }
      if (path === "/orders/o1") return json(200, orderFixture({ order_status: status as "PENDING" }));
    });
    await boot("/painel/meus-pedidos/o1");
    await userEvent.click(await screen.findByRole("button", { name: /Cancelar pedido/ }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancelar pedido" }));

    await waitFor(() => expect(screen.getByText("Cancelado")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /Cancelar pedido/ })).toBeNull();
    expect(calls.some((c) => c.path === "/orders/o1/cancel")).toBe(true);
  });
});