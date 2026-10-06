// frontend/src/features/chat/pages/AdminChatPage.tsx
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { ChatWindow } from "../components/ChatWindow";
import { ConversationList } from "../components/ConversationList";
import { useAdminInbox } from "../hooks";

export default function AdminChatPage() {
  const { me } = useAuth();
  const inbox = useAdminInbox();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = inbox.data ?? [];

  // Seleciona a primeira conversa assim que a lista chega.
  useEffect(() => {
    if (!selectedId && list.length > 0) setSelectedId(list[0]!.conversation_id);
  }, [list, selectedId]);

  const selected = list.find((c) => c.conversation_id === selectedId);

  return (
    <>
      <PageHeader title="Chat" description="Conversas dos clientes com a loja. A lista atualiza sozinha a cada 20 segundos." />

      {inbox.isPending ? (
        <Skeleton className="h-96" />
      ) : inbox.isError ? (
        <ErrorState error={inbox.error} onRetry={() => void inbox.refetch()} retrying={inbox.isFetching} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="size-7" aria-hidden="true" />}
          title="Nenhuma conversa ainda"
          description="Quando um cliente iniciar um chat, ele aparece aqui."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <ConversationList conversations={list} selectedId={selectedId} onSelect={setSelectedId} showClient />
          <div>
            {selected && me && (
              <ChatWindow
                key={selected.conversation_id}
                conversationId={selected.conversation_id}
                currentUserId={me.user.user_id}
                readOnly={selected.status !== "open"}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}