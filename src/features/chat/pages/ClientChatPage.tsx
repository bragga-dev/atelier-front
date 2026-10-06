import { useEffect, useState } from "react";
import type { ConversationOut } from "@/api/types";
import { MessageCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/panel/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { ChatWindow } from "../components/ChatWindow";
import { ConversationList } from "../components/ConversationList";
import { useMyConversations, useStartConversation } from "../hooks";

export default function ClientChatPage() {
  const { me } = useAuth();
  const conversations = useMyConversations();
  const start = useStartConversation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Conversa recém-criada: abre a janela na hora, sem esperar a lista refazer a busca.
  const [created, setCreated] = useState<ConversationOut | null>(null);
  const fetched = conversations.data ?? [];
  const list = created && !fetched.some((c) => c.conversation_id === created.conversation_id) ? [created, ...fetched] : fetched;
  const open = list.find((c) => c.status === "open");

  // Seleciona a conversa aberta (ou a mais recente) assim que a lista chega.
  useEffect(() => {
    if (!selectedId && list.length > 0) setSelectedId((open ?? list[0]!).conversation_id);
  }, [list, open, selectedId]);

  const selected = list.find((c) => c.conversation_id === selectedId);

  const startNew = async () => {
    const conversation = await start.mutateAsync(undefined);
    setCreated(conversation);
    setSelectedId(conversation.conversation_id);
  };

  return (
    <>
      <PageHeader
        title="Chat com a loja"
        description="Tire dúvidas sobre peças, prazos e pedidos. Você pode enviar fotos, vídeos, PDF ou TXT."
        actions={!open && list.length > 0 ? <Button onClick={startNew} loading={start.isPending}><Plus className="size-4" aria-hidden="true" />Nova conversa</Button> : undefined}
      />

      {conversations.isPending ? (
        <Skeleton className="h-96" />
      ) : conversations.isError ? (
        <ErrorState error={conversations.error} onRetry={() => void conversations.refetch()} retrying={conversations.isFetching} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="size-7" aria-hidden="true" />}
          title="Fale com a gente"
          description="Inicie uma conversa e responderemos o quanto antes."
          action={<Button onClick={startNew} loading={start.isPending}>Iniciar conversa</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          {list.length > 1 && <ConversationList conversations={list} selectedId={selectedId} onSelect={setSelectedId} />}
          <div className={list.length > 1 ? "" : "lg:col-span-2"}>
            {selected && me && <ChatWindow key={selected.conversation_id} conversationId={selected.conversation_id} currentUserId={me.user.user_id} readOnly={selected.status !== "open"} />}
          </div>
        </div>
      )}
    </>
  );
}