// frontend/src/app/chat.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "@/api/token-store";
import { chatSocketUrl } from "@/lib/ws";
import { bootApp, CLIENT_ME, json, mockApi } from "./test-utils";

/** WebSocket falso: controlamos abertura, mensagens recebidas e fechamento. */
class FakeSocket {
  static instances: FakeSocket[] = [];
  static OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  constructor(public url: string) { FakeSocket.instances.push(this); }
  send(data: string) { this.sent.push(data); }
  close() { this.readyState = 3; }
  open() { this.readyState = 1; this.onopen?.(); }
  receive(payload: unknown) { this.onmessage?.({ data: JSON.stringify(payload) }); }
}

const CONV = { conversation_id: "c1", client_id: "u1", client_name: "Ana", status: "open", subject: null, last_message_at: null };
const MSG = (over: Record<string, unknown> = {}) => ({
  message_id: "m1", conversation_id: "c1", sender_id: "admin-1", sender_name: "Loja", content: "Olá! Como posso ajudar?",
  is_read: false, created_at: "2026-10-01T12:00:00Z", attachments: [], ...over,
});

beforeEach(() => {
  FakeSocket.instances = [];
  tokenStore.clear();
  vi.stubGlobal("scrollTo", () => {});
  vi.stubGlobal("WebSocket", FakeSocket);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("chat do cliente", () => {
  it("monta a URL do WebSocket a partir da URL da API", () => {
    expect(chatSocketUrl("abc", "tok")).toBe("ws://localhost:8000/ws/chat/abc/?token=tok");
  });

  it("sem conversa, oferece iniciar uma; ao iniciar abre a janela", async () => {
    const api = mockApi({ me: CLIENT_ME, handlers: { "GET /chat/conversations/mine": [], "POST /chat/conversations": () => json(201, CONV), "GET /chat/conversations/c1/messages": [] } });
    await bootApp("/painel/chat");
    fireEvent.click(await screen.findByRole("button", { name: /iniciar conversa/i }));
    expect(await screen.findByLabelText("Escreva sua mensagem")).toBeTruthy();
    expect(api.calls.some((c) => c.method === "POST" && c.path === "/chat/conversations")).toBe(true);
  });

  it("carrega o histórico, conecta com o token e envia texto pelo WebSocket", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /chat/conversations/mine": [CONV], "GET /chat/conversations/c1/messages": [MSG()], "POST /chat/conversations/c1/read": { updated: 1 } } });
    await bootApp("/painel/chat");
    expect(await screen.findByText("Olá! Como posso ajudar?")).toBeTruthy();

    await waitFor(() => expect(FakeSocket.instances.length).toBe(1));
    const socket = FakeSocket.instances[0]!;
    expect(socket.url).toMatch(/^ws:\/\/localhost:8000\/ws\/chat\/c1\/\?token=/);
    socket.open();

    fireEvent.change(screen.getByLabelText("Escreva sua mensagem"), { target: { value: "Quero um colar" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(socket.sent.some((s) => s.includes("Quero um colar"))).toBe(true));
    expect(JSON.parse(socket.sent.find((s) => s.includes("Quero um colar"))!)).toEqual({ type: "message", content: "Quero um colar" });
  });

  it("mensagem recebida em tempo real aparece e não duplica", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /chat/conversations/mine": [CONV], "GET /chat/conversations/c1/messages": [], "POST /chat/conversations/c1/read": { updated: 0 } } });
    await bootApp("/painel/chat");
    await waitFor(() => expect(FakeSocket.instances.length).toBe(1));
    const socket = FakeSocket.instances[0]!;
    socket.open();

    const incoming = { type: "message", message: MSG({ message_id: "m9", content: "Chegou agora" }) };
    socket.receive(incoming);
    socket.receive(incoming); // reentrega do broadcast
    await screen.findByText("Chegou agora");
    expect(screen.getAllByText("Chegou agora")).toHaveLength(1);
  });

  it("fecha com 4403 mostra acesso negado e não tenta reconectar", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /chat/conversations/mine": [CONV], "GET /chat/conversations/c1/messages": [] } });
    await bootApp("/painel/chat");
    await waitFor(() => expect(FakeSocket.instances.length).toBe(1));
    FakeSocket.instances[0]!.onclose?.({ code: 4403 });
    expect(await screen.findByText(/não tem acesso a esta conversa/i)).toBeTruthy();
    expect(FakeSocket.instances.length).toBe(1);
  });

  it("conversa encerrada é somente leitura", async () => {
    mockApi({ me: CLIENT_ME, handlers: { "GET /chat/conversations/mine": [{ ...CONV, status: "closed" }], "GET /chat/conversations/c1/messages": [MSG()] } });
    await bootApp("/painel/chat");
    expect(await screen.findByText(/conversa foi encerrada/i)).toBeTruthy();
    expect(screen.queryByLabelText("Escreva sua mensagem")).toBeNull();
  });
});

describe("chat do admin", () => {
  it("lista as conversas abertas e abre a selecionada", async () => {
    const admin = { user: { user_id: "a1", email: "admin@example.com", role: "admin", is_trusty: true, is_active: true, date_joined: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z" }, client: null, admin: { admin_id: "ad1", full_name: "Admin", photo_url: null } };
    mockApi({ me: admin, handlers: { "GET /chat/conversations/admin": [CONV], "GET /chat/conversations/c1/messages": [MSG({ sender_id: "u1", sender_name: "Ana", content: "oi" })], "POST /chat/conversations/c1/read": { updated: 1 } } });
    await bootApp("/admin/chat");
    fireEvent.click(await screen.findByRole("button", { name: /Ana/ }));
    expect(await screen.findByText("oi")).toBeTruthy();
  });
});

describe("anexos no chat", () => {
  it("imagem que não carrega vira link com o nome do arquivo", async () => {
    const attachment = { attachment_id: "a1", file_type: "image", original_filename: "mila.jpeg", file_size: 2048, url: "http://localhost:9000/luxuryfashionprivate/chat/mila.jpeg" };
    mockApi({ me: CLIENT_ME, handlers: { "GET /chat/conversations/mine": [CONV], "GET /chat/conversations/c1/messages": [MSG({ sender_id: "u1", content: "", attachments: [attachment] })], "POST /chat/conversations/c1/read": { updated: 0 } } });
    await bootApp("/painel/chat");
    const img = await screen.findByAltText("mila.jpeg");
    fireEvent.error(img); // o navegador não conseguiu baixar
    const link = await screen.findByRole("link", { name: /mila\.jpeg/ });
    expect(link.getAttribute("href")).toBe(attachment.url);
    expect(screen.queryByAltText("mila.jpeg")).toBeNull();
  });
});