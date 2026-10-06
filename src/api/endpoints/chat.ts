import { http } from "../http";
import type { ChatMessageOut, ConversationOut } from "../types";

export const chatApi = {
  start: (orderId?: string) => http.post<ConversationOut>("/chat/conversations", { order_id: orderId ?? null }),
  mine: (signal?: AbortSignal) => http.get<ConversationOut[]>("/chat/conversations/mine", { signal }),
  adminInbox: (status?: string, signal?: AbortSignal) =>
    http.get<ConversationOut[]>("/chat/conversations/admin", { signal, query: { status } }),
  get: (conversationId: string, signal?: AbortSignal) =>
    http.get<ConversationOut>(`/chat/conversations/${conversationId}`, { signal }),
  messages: (conversationId: string, signal?: AbortSignal) =>
    http.get<ChatMessageOut[]>(`/chat/conversations/${conversationId}/messages`, { signal }),

  /** Texto e/ou até 5 anexos (multipart). O texto "ao vivo" vai pelo WebSocket. */
  send: (conversationId: string, content: string, files: File[] = []) => {
    const form = new FormData();
    form.append("content", content);
    files.forEach((file) => form.append("files", file));
    return http.post<ChatMessageOut>(`/chat/conversations/${conversationId}/messages`, form);
  },
  markRead: (conversationId: string) =>
    http.post<{ updated: number }>(`/chat/conversations/${conversationId}/read`),
};