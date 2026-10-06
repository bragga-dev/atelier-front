// frontend/src/features/admin/pages/AdminReviewsPage.tsx
import { useState } from "react";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/panel/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { useAdminReviews, useReviewModeration } from "../hooks";

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<"pending" | "authorized">("pending");
  const reviews = useAdminReviews(tab);
  const mod = useReviewModeration();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const items = reviews.data ?? [];

  return (
    <>
      <PageHeader title="Avaliações" description="Avaliações só aparecem na loja depois de aprovadas." />

      <div role="tablist" aria-label="Estado da avaliação" className="mb-5 flex gap-2">
        {([["pending", "Aguardando moderação"], ["authorized", "Publicadas"]] as const).map(([value, label]) => (
          <button key={value} role="tab" type="button" aria-selected={tab === value} onClick={() => setTab(value)}
            className={cn("rounded-full px-5 py-2 text-sm font-semibold", tab === value ? "bg-espresso text-cream" : "border border-sand-200 hover:border-ink/30")}>{label}</button>
        ))}
      </div>

      {reviews.isPending ? <Skeleton className="h-40" /> : reviews.isError ? (
        <ErrorState error={reviews.error} onRetry={() => void reviews.refetch()} retrying={reviews.isFetching} />
      ) : items.length === 0 ? (
        <EmptyState title={tab === "pending" ? "Nada para moderar" : "Nenhuma avaliação publicada"} />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.reviews_id} className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.order_item.product.product_name}</p>
                  <div className="mt-0.5 flex items-center gap-2"><StarRating value={r.reviews} /><span className="text-xs text-ink-soft">{r.user.email} · {formatDateTime(r.created_at)}</span></div>
                  {r.comment ? <p className="mt-2 whitespace-pre-wrap text-sm">{r.comment}</p> : <p className="mt-2 text-sm italic text-ink-soft">Sem comentário.</p>}
                </div>
                <div className="flex gap-1">
                  {tab === "pending" ? (
                    <Button size="sm" onClick={() => mod.authorize.mutate(r.reviews_id)} loading={mod.authorize.isPending && mod.authorize.variables === r.reviews_id}><Check className="size-4" aria-hidden="true" />Publicar</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => mod.revoke.mutate(r.reviews_id)} loading={mod.revoke.isPending && mod.revoke.variables === r.reviews_id}><EyeOff className="size-4" aria-hidden="true" />Despublicar</Button>
                  )}
                  <Button variant="ghost" size="sm" aria-label="Excluir avaliação" onClick={() => setToDelete(r.reviews_id)}><Trash2 className="size-4" aria-hidden="true" /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={Boolean(toDelete)} title="Excluir avaliação?" description="A exclusão é permanente." confirmLabel="Excluir"
        loading={mod.remove.isPending} onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && mod.remove.mutate(toDelete, { onSettled: () => setToDelete(null) })} />
    </>
  );
}