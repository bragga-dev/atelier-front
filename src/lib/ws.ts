import { env } from "./env";

/** Deriva a URL do WebSocket do chat a partir da URL da API (http→ws, https→wss, sem o /api). */
export function chatSocketUrl(conversationId: string, token: string): string {
  const base = new URL(env.apiUrl);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = `/ws/chat/${conversationId}/`;
  base.search = new URLSearchParams({ token }).toString();
  return base.toString();
}