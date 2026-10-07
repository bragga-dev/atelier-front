// frontend/src/features/chat/components/ChatWidget.tsx
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Maximize2, MessageCircle, MessagesSquare, Plus, X } from "lucide-react";
import { Link, useLocation } from "react-router";
import { toUserMessage } from "@/api/errors";
import type { ConversationOut } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/auth-context";
import { isAdminUser } from "@/features/auth/display-name";
import { useAdminInbox, useMyConversations, useStartConversation } from "../hooks";
import { ChatWindow } from "./ChatWindow";
import { ConversationList } from "./ConversationList";

const HEADER_BUTTON = "grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/10";

interface ShellProps {
  title: string;
  /** Quando definido, mostra a seta de voltar (admin: da conversa para a lista). */
  onBack?: () => void;
  expandTo: string;
  onClose: () => void;
  children: ReactNode;
}

/** Moldura do popup: barra de título com voltar / expandir / fechar. */
function PopupShell({ title, onBack, expandTo, onClose, children }: ShellProps) {
  return (
    <>
      <div className="flex items-center gap-1 bg-oxblood-700 px-2 py-2 text-cream">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Voltar às conversas" className={HEADER_BUTTON}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        )}
        <h2 className="min-w-0 flex-1 truncate px-2 text-base font-semibold">{title}</h2>
        <Link to={expandTo} onClick={onClose} aria-label="Expandir para a página do chat" title="Expandir" className={HEADER_BUTTON}>
          <Maximize2 className="size-5" aria-hidden="true" />
        </Link>
        <button type="button" onClick={onClose} aria-label="Fechar chat" title="Fechar" className={HEADER_BUTTON}>
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="grid h-full place-items-center p-6 text-center">{children}</div>;
}

// ── Cliente: a conversa dele com a loja ──────────────────────────────────────
function ClientPopup({ userId, onClose }: { userId: string; onClose: () => void }) {
  const conversations = useMyConversations();
  const start = useStartConversation();
  const [created, setCreated] = useState<ConversationOut | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const fetched = conversations.data ?? [];
  const list = created && !fetched.some((c) => c.conversation_id === created.conversation_id) ? [created, ...fetched] : fetched;
  const open = list.find((c) => c.status === "open");
  const current = open ?? list[0];

  const startNew = async () => {
    setStartError(null);
    try {
      setCreated(await start.mutateAsync(undefined));
    } catch (error) {
      setStartError(toUserMessage(error, "Não foi possível iniciar a conversa."));
    }
  };

  let body: ReactNode;
  if (conversations.isPending) {
    body = <Centered><Spinner label="Carregando conversa…" /></Centered>;
  } else if (conversations.isError) {
    body = <ErrorState error={conversations.error} onRetry={() => void conversations.refetch()} retrying={conversations.isFetching} />;
  } else if (!current) {
    body = (
      <Centered>
        <div>
          <MessagesSquare className="mx-auto size-10 text-oxblood-600" aria-hidden="true" />
          <p className="mt-3 font-semibold">Fale com a gente</p>
          <p className="mt-1 text-sm text-ink-soft">Inicie uma conversa e responderemos o quanto antes.</p>
          {startError && <Alert tone="error" className="mt-3">{startError}</Alert>}
          <Button className="mt-4" onClick={() => void startNew()} loading={start.isPending}>Iniciar conversa</Button>
        </div>
      </Centered>
    );
  } else {
    body = (
      <div className="flex h-full flex-col">
        {!open && (
          <div className="flex items-center justify-between gap-2 border-b border-sand-200 bg-cream/60 px-3 py-2">
            <span className="text-sm text-ink-soft">Conversa encerrada.</span>
            <Button size="sm" onClick={() => void startNew()} loading={start.isPending}><Plus className="size-4" aria-hidden="true" />Nova conversa</Button>
          </div>
        )}
        {startError && <Alert tone="error" className="m-2">{startError}</Alert>}
        <div className="min-h-0 flex-1">
          <ChatWindow key={current.conversation_id} conversationId={current.conversation_id} currentUserId={userId} readOnly={current.status !== "open"} embedded />
        </div>
      </div>
    );
  }

  return <PopupShell title="Chat com a loja" expandTo="/painel/chat" onClose={onClose}>{body}</PopupShell>;
}

// ── Admin: caixa de entrada + conversa selecionada ───────────────────────────
function AdminPopup({ userId, onClose }: { userId: string; onClose: () => void }) {
  const inbox = useAdminInbox();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = inbox.data ?? [];
  const selected = list.find((c) => c.conversation_id === selectedId);

  let body: ReactNode;
  if (inbox.isPending) {
    body = <Centered><Spinner label="Carregando conversas…" /></Centered>;
  } else if (inbox.isError) {
    body = <ErrorState error={inbox.error} onRetry={() => void inbox.refetch()} retrying={inbox.isFetching} />;
  } else if (selected) {
    body = <ChatWindow key={selected.conversation_id} conversationId={selected.conversation_id} currentUserId={userId} readOnly={selected.status !== "open"} embedded />;
  } else if (list.length === 0) {
    body = <Centered><p className="text-sm text-ink-soft">Nenhuma conversa ainda. Quando um cliente iniciar um chat, ele aparece aqui.</p></Centered>;
  } else {
    body = <div className="h-full overflow-y-auto p-3"><ConversationList conversations={list} selectedId={null} onSelect={setSelectedId} showClient /></div>;
  }

  return (
    <PopupShell
      title={selected ? selected.client_name : "Conversas dos clientes"}
      onBack={selected ? () => setSelectedId(null) : undefined}
      expandTo={selected ? `/admin/chat?conversa=${selected.conversation_id}` : "/admin/chat"}
      onClose={onClose}
    >
      {body}
    </PopupShell>
  );
}

/**
 * Chat flutuante (estilo Messenger/Instagram): botão fixo no canto que abre um popup com a conversa,
 * com atalho pra expandir até a página principal do chat. Só aparece logado e fora da própria página do chat.
 * O popup só monta (e abre o WebSocket) enquanto está aberto.
 */
export function ChatWidget() {
  const { me, status, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const admin = isAdminUser(me);
  const visible = status !== "loading" && isAuthenticated && Boolean(me) && pathname !== (admin ? "/admin/chat" : "/painel/chat");

  // Esc fecha; ao abrir o foco vai pro popup, ao fechar volta pro botão.
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) launcherRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Saiu da conta (ou entrou na página do chat): fecha o popup.
  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  if (!visible || !me) return null;
  const userId = me.user.user_id;
  const close = () => setOpen(false);

  if (!open) {
    return (
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={admin ? "Abrir chat com os clientes" : "Abrir chat com a loja"}
        aria-haspopup="dialog"
        aria-expanded="false"
        className="fixed bottom-4 right-4 z-50 grid size-14 place-items-center rounded-full bg-oxblood-600 text-cream shadow-lg transition-colors hover:bg-oxblood-700"
      >
        <MessageCircle className="size-7" aria-hidden="true" />
      </button>
    );
  }

  return (
    <section
      ref={dialogRef}
      role="dialog"
      aria-label={admin ? "Chat com os clientes" : "Chat com a loja"}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white shadow-2xl outline-none sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[34rem] sm:max-h-[calc(100dvh-2rem)] sm:w-[22rem] sm:rounded-2xl sm:border sm:border-sand-200"
    >
      {admin ? <AdminPopup userId={userId} onClose={close} /> : <ClientPopup userId={userId} onClose={close} />}
    </section>
  );
}