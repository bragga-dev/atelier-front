import { useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "@/components/panel/PageHeader";
import { PagerButtons } from "@/components/panel/PagerButtons";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { safeInternalPath } from "@/lib/safe-redirect";
import { useNotificationActions, useNotifications } from "../hooks";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = useNotifications({ page, unreadOnly });
  const { markRead, markAllRead, remove } = useNotificationActions();
  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Notificações"
        actions={
          <>
            <Button variant={unreadOnly ? "secondary" : "outline"} size="sm" onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }} aria-pressed={unreadOnly}>
              Só não lidas
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
              <CheckCheck className="size-4" aria-hidden="true" />Marcar tudo como lido
            </Button>
          </>
        }
      />

      {query.isPending ? (
        <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : items.length === 0 ? (
        <EmptyState icon={<Bell className="size-7" aria-hidden="true" />} title={unreadOnly ? "Nada por ler" : "Sem notificações"} description="Avisos sobre pedidos e pagamentos aparecem aqui." />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const target = n.action_url ? safeInternalPath(n.action_url, "") : "";
            return (
              <li key={n.notification_id} className={cn("flex items-start gap-3 rounded-[var(--radius-card)] border p-4", n.is_read ? "border-sand-200 bg-white" : "border-gold-300 bg-gold-300/15")}>
                <span aria-hidden="true" className={cn("mt-2 size-2.5 shrink-0 rounded-full", n.is_read ? "bg-transparent" : "bg-oxblood-600")} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-ink-soft">{n.body}</p>
                  <p className="mt-1 text-xs text-ink-soft">{formatDateTime(n.created_at)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {target && (
                      <Link to={target} onClick={() => !n.is_read && markRead.mutate(n.notification_id)} className="text-sm font-semibold text-oxblood-700 hover:underline">
                        Ver detalhes
                      </Link>
                    )}
                    {!n.is_read && (
                      <button type="button" className="text-sm font-semibold text-ink-soft hover:underline" onClick={() => markRead.mutate(n.notification_id)}>
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" aria-label={`Excluir notificação ${n.title}`} onClick={() => remove.mutate(n.notification_id)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <PagerButtons page={query.data?.page ?? page} pages={query.data?.pages ?? 1} onChange={setPage} />
    </>
  );
}