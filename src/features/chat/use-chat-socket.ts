import { useCallback, useEffect, useRef, useState } from "react";
import { refreshAccessToken } from "@/api/session";
import { tokenStore } from "@/api/token-store";
import type { ChatMessageOut } from "@/api/types";
import { chatSocketUrl } from "@/lib/ws";

// Códigos de fechamento do consumer (apps/chat/consumers.py).
const CLOSE_UNAUTHENTICATED = 4401;
const CLOSE_FORBIDDEN = 4403;
const CLOSE_NOT_FOUND = 4404;
const MAX_RETRIES = 6;

export type SocketStatus = "connecting" | "open" | "reconnecting" | "closed";

export type ChatEvent =
  | { type: "message"; message: ChatMessageOut }
  | { type: "read"; reader_id: string }
  | { type: "error"; detail: string };

interface Options {
  conversationId: string;
  onEvent: (event: ChatEvent) => void;
}

/** Conexão do chat com reconexão (backoff) e renovação do token quando o handshake volta 4401. */
export function useChatSocket({ conversationId, onEvent }: Options) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [fatal, setFatal] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let disposed = false;
    let retries = 0;
    let timer: number | undefined;

    const connect = async () => {
      if (disposed) return;
      let token = tokenStore.get();
      if (!token) {
        try { token = await refreshAccessToken(); } catch { setFatal("Sessão expirada. Entre novamente."); setStatus("closed"); return; }
      }
      if (disposed) return;

      const socket = new WebSocket(chatSocketUrl(conversationId, token));
      socketRef.current = socket;

      socket.onopen = () => { retries = 0; setStatus("open"); };
      socket.onmessage = (event) => {
        try { onEventRef.current(JSON.parse(String(event.data)) as ChatEvent); } catch { /* ignora quadro inválido */ }
      };
      socket.onclose = async (event) => {
        socketRef.current = null;
        if (disposed) return;

        if (event.code === CLOSE_FORBIDDEN) { setFatal("Você não tem acesso a esta conversa."); setStatus("closed"); return; }
        if (event.code === CLOSE_NOT_FOUND) { setFatal("Conversa não encontrada."); setStatus("closed"); return; }
        if (event.code === CLOSE_UNAUTHENTICATED) {
          try { await refreshAccessToken(); } catch { setFatal("Sessão expirada. Entre novamente."); setStatus("closed"); return; }
        }
        if (retries >= MAX_RETRIES) { setFatal("Sem conexão com o chat. Recarregue a página."); setStatus("closed"); return; }

        setStatus("reconnecting");
        const delay = Math.min(1000 * 2 ** retries, 15_000);
        retries += 1;
        timer = window.setTimeout(() => void connect(), delay);
      };
    };

    setStatus("connecting");
    setFatal(null);
    void connect();

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      socketRef.current?.close(1000);
      socketRef.current = null;
    };
  }, [conversationId]);

  /** Envia um quadro. Retorna `false` se a conexão não está aberta (o chamador usa o fallback REST). */
  const send = useCallback((payload: { type: "message"; content: string } | { type: "read" }): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  return { status, fatal, send };
}