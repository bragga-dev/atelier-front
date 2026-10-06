import type { ConversationOut } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

interface ConversationListProps {
  conversations: ConversationOut[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showClient?: boolean;
}

export function ConversationList({ conversations, selectedId, onSelect, showClient = false }: ConversationListProps) {
  return (
    <ul className="divide-y divide-sand-200 overflow-hidden rounded-[var(--radius-card)] border border-sand-200 bg-white">
      {conversations.map((c) => (
        <li key={c.conversation_id}>
          <button
            type="button"
            onClick={() => onSelect(c.conversation_id)}
            aria-current={selectedId === c.conversation_id || undefined}
            className={cn("block w-full px-4 py-3 text-left hover:bg-cream/60", selectedId === c.conversation_id && "bg-oxblood-50")}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{showClient ? c.client_name : c.subject || "Conversa com a loja"}</span>
              <Badge tone={c.status === "open" ? "success" : "neutral"}>{c.status === "open" ? "Aberta" : "Encerrada"}</Badge>
            </span>
            <span className="mt-0.5 block truncate text-xs text-ink-soft">
              {showClient && c.subject ? `${c.subject} · ` : ""}
              {c.last_message_at ? formatDateTime(c.last_message_at) : "Sem mensagens"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}