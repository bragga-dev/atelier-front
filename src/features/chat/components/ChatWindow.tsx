// frontend/src/features/chat/components/ChatWindow.tsx
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Paperclip, Send, X } from "lucide-react";
import { chatApi } from "@/api/endpoints/chat";
import { toUserMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import type { ChatAttachmentOut, ChatMessageOut } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { safeExternalUrl } from "@/lib/safe-url";
import { useMessages } from "../hooks";
import { useChatSocket, type ChatEvent } from "../use-chat-socket";

const MAX_FILES = 5;
const ACCEPT = "image/*,video/*,application/pdf,text/plain";

interface ChatWindowProps {
  conversationId: string;
  /** `user_id` de quem está logado — separa mensagens minhas das do outro lado. */
  currentUserId: string;
  /** Desabilita o envio (conversa encerrada). */
  readOnly?: boolean;
  /** Preenche o container (popup do chat): sem altura fixa, borda nem cantos arredondados. */
  embedded?: boolean;
}

/** Anexo na bolha. Imagem que não carrega (URL expirada/inacessível) vira link com o nome — nunca só o alt-text solto. */
function AttachmentView({ attachment, mine }: { attachment: ChatAttachmentOut; mine: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const href = safeExternalUrl(attachment.url);
  if (!href) return null;

  if (attachment.file_type === "image" && !imageFailed) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="mt-2 block">
        <img src={href} alt={attachment.original_filename} className="max-h-48 rounded-lg" loading="lazy" onError={() => setImageFailed(true)} />
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn("mt-2 flex items-center gap-2 rounded-lg px-3 py-2 underline", mine ? "bg-oxblood-700" : "bg-sand")}>
      <FileText className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{attachment.original_filename}</span>
      <span className="shrink-0 text-xs opacity-70">{formatSize(attachment.file_size)}</span>
    </a>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ChatWindow({ conversationId, currentUserId, readOnly = false, embedded = false }: ChatWindowProps) {
  const queryClient = useQueryClient();
  const messages = useMessages(conversationId);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const key = queryKeys.chat.messages(conversationId);

  const handleEvent = useCallback(
    (event: ChatEvent) => {
      if (event.type === "message") {
        queryClient.setQueryData<ChatMessageOut[]>(key, (current = []) =>
          // O envio por REST também é transmitido no grupo: dedupe pelo id.
          current.some((m) => m.message_id === event.message.message_id) ? current : [...current, event.message],
        );
      } else if (event.type === "read") {
        // O outro lado leu: minhas mensagens passam a "lidas".
        queryClient.setQueryData<ChatMessageOut[]>(key, (current = []) =>
          current.map((m) => (m.sender_id === currentUserId ? { ...m, is_read: true } : m)),
        );
      } else if (event.type === "error") {
        setSendError(event.detail);
      }
    },
    [queryClient, key, currentUserId],
  );

  const socket = useChatSocket({ conversationId, onEvent: handleEvent });

  const unreadFromOthers = (messages.data ?? []).some((m) => m.sender_id !== currentUserId && !m.is_read);

  // Marca como lido ao abrir e sempre que chega algo novo do outro lado.
  useEffect(() => {
    if (!unreadFromOthers || readOnly) return;
    if (!socket.send({ type: "read" })) void chatApi.markRead(conversationId).catch(() => undefined);
    queryClient.setQueryData<ChatMessageOut[]>(key, (current = []) =>
      current.map((m) => (m.sender_id !== currentUserId ? { ...m, is_read: true } : m)),
    );
  }, [unreadFromOthers, readOnly, socket, conversationId, queryClient, key, currentUserId]);

  // Rola para a mensagem mais recente.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.data?.length]);

  const onPickFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files, ...Array.from(picked)];
    if (next.length > MAX_FILES) setSendError(`Envie no máximo ${MAX_FILES} anexos por mensagem.`);
    else setSendError(null);
    setFiles(next.slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if ((!content && files.length === 0) || sending) return;
    setSendError(null);

    // Texto puro vai pelo WebSocket; com anexo (ou sem conexão) usamos o POST multipart.
    if (files.length === 0 && socket.send({ type: "message", content })) {
      setText("");
      return;
    }
    setSending(true);
    try {
      const created = await chatApi.send(conversationId, content, files);
      queryClient.setQueryData<ChatMessageOut[]>(key, (current = []) =>
        current.some((m) => m.message_id === created.message_id) ? current : [...current, created],
      );
      setText("");
      setFiles([]);
    } catch (error) {
      setSendError(toUserMessage(error, "Não foi possível enviar a mensagem."));
    } finally {
      setSending(false);
    }
  };

  if (messages.isPending) return <div className={cn("grid place-items-center", embedded ? "h-full" : "h-80")}><Spinner label="Carregando conversa…" /></div>;
  if (messages.isError) return <ErrorState error={messages.error} onRetry={() => void messages.refetch()} retrying={messages.isFetching} />;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-white",
        embedded ? "h-full min-h-0" : "h-[32rem] max-h-[75vh] rounded-[var(--radius-card)] border border-sand-200",
      )}
    >
      {socket.fatal ? (
        <Alert tone="error" className="m-3">{socket.fatal}</Alert>
      ) : socket.status !== "open" ? (
        <p role="status" className="bg-gold-300/30 px-4 py-1.5 text-center text-xs font-medium text-ink">
          {socket.status === "reconnecting" ? "Reconectando…" : "Conectando…"} As mensagens ainda podem ser enviadas.
        </p>
      ) : null}

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-cream/50 p-4" aria-live="polite" aria-label="Mensagens">
        {(messages.data ?? []).length === 0 && <p className="py-10 text-center text-sm text-ink-soft">Nenhuma mensagem ainda. Diga olá!</p>}
        {(messages.data ?? []).map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div key={message.message_id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", mine ? "rounded-br-sm bg-oxblood-600 text-cream" : "rounded-bl-sm bg-white text-ink")}>
                {!mine && <p className="mb-0.5 text-xs font-semibold text-oxblood-700">{message.sender_name}</p>}
                {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                {(message.attachments ?? []).map((attachment) => (
                  <AttachmentView key={attachment.attachment_id} attachment={attachment} mine={mine} />
                ))}
                <p className={cn("mt-1 text-right text-[11px]", mine ? "text-cream/70" : "text-ink-soft")}>
                  {formatDateTime(message.created_at)}
                  {mine && (message.is_read ? " · lida" : " · enviada")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {readOnly ? (
        <p className="border-t border-sand-200 p-3 text-center text-sm text-ink-soft">Esta conversa foi encerrada.</p>
      ) : (
        <form onSubmit={onSubmit} className="border-t border-sand-200 p-3">
          {sendError && <Alert tone="error" className="mb-2">{sendError}</Alert>}
          {files.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs">
                  <span className="max-w-40 truncate">{file.name}</span>
                  <button type="button" aria-label={`Remover ${file.name}`} onClick={() => setFiles(files.filter((_, i) => i !== index))}>
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" multiple accept={ACCEPT} className="sr-only" id={`anexo-${conversationId}`} onChange={(e) => onPickFiles(e.target.files)} />
            <label htmlFor={`anexo-${conversationId}`} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-espresso/5" title="Anexar arquivo">
              <Paperclip className="size-5" aria-hidden="true" />
              <span className="sr-only">Anexar arquivo</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); }
              }}
              rows={1}
              aria-label="Escreva sua mensagem"
              placeholder="Escreva sua mensagem…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-sand-200 px-4 py-2.5 text-base"
            />
            <Button type="submit" loading={sending} disabled={!text.trim() && files.length === 0} aria-label="Enviar" className="size-11 shrink-0 px-0">
              <Send className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}