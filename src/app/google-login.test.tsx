// @vitest-environment jsdom
import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "@/api/token-store";
import { bootApp, CLIENT_ME, json, mockApi } from "./test-utils";

vi.mock("@/lib/env", () => ({ env: { apiUrl: "http://localhost:8000/api", googleClientId: "test-client.apps.googleusercontent.com" } }));

type GisConfig = { client_id: string; callback: (r: { credential?: string }) => void };
let gisConfig: GisConfig | null = null;
const renderButton = vi.fn();

beforeEach(() => {
  tokenStore.clear();
  gisConfig = null;
  renderButton.mockClear();
  vi.stubGlobal("scrollTo", () => {});
  // Já "carregado": loadGoogleIdentity() devolve este objeto sem inserir <script>.
  (window as unknown as { google: unknown }).google = {
    accounts: { id: { initialize: (cfg: GisConfig) => { gisConfig = cfg; }, renderButton, disableAutoSelect: vi.fn() } },
  };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete (window as unknown as { google?: unknown }).google; });

describe("login com Google", () => {
  it("renderiza o botão oficial com o client id configurado", async () => {
    mockApi({ me: null });
    await bootApp("/entrar");
    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    expect(gisConfig?.client_id).toBe("test-client.apps.googleusercontent.com");
    expect(renderButton.mock.calls[0]![1]).toMatchObject({ text: "signin_with", locale: "pt-BR" });
  });

  it("envia o id_token ao backend, autentica e redireciona para `next`", async () => {
    const api = mockApi({
      me: CLIENT_ME,
      anonymous: true,
      handlers: { "POST /auth/google": () => { api.authenticate(); return json(200, { access: "tok-google" }); } },
    });
    const router = await bootApp("/entrar?next=%2Fpainel%2Fmeus-pedidos");
    await waitFor(() => expect(gisConfig).not.toBeNull());

    // O usuário conclui o fluxo no Google → o GIS chama a callback com o credential (ID token).
    gisConfig!.callback({ credential: "eyJ.google.idtoken" });

    await waitFor(() => expect(router.state.location.pathname).toBe("/painel/meus-pedidos"));
    expect(api.calls.find((c) => c.path === "/auth/google")?.body).toEqual({ id_token: "eyJ.google.idtoken" });
    expect(tokenStore.get()).toBe("tok-google");
  });

  it("mostra a mensagem quando o backend recusa o token", async () => {
    mockApi({ me: null, handlers: { "POST /auth/google": () => json(401, { detail: "Token do Google inválido." }) } });
    await bootApp("/entrar");
    await waitFor(() => expect(gisConfig).not.toBeNull());
    gisConfig!.callback({ credential: "token-ruim" });
    expect(await screen.findByText(/inválid|não foi possível|credenciais/i)).toBeTruthy();
    expect(tokenStore.get()).toBeNull();
  });
});