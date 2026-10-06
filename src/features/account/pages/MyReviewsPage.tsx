import { useState } from "react";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarRating } from "@/components/ui/StarRating";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { formatDate } from "@/lib/format";
import { ReviewForm } from "../components/ReviewForm";
import { useDeleteReview, useMyReviews, useUpdateReview } from "../hooks";

function EditReview({ reviewId, children }: { reviewId: string; children: (save: ReturnType<typeof useUpdateReview>) => React.ReactNode }) {
  return <>{children(useUpdateReview(reviewId))}</>;
}

export default function MyReviewsPage() {
  const reviews = useMyReviews();
  const remove = useDeleteReview();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const items = reviews.data ?? [];

  return (
    <>
      <PageHeader title="Minhas avaliações" description="Avaliações passam por moderação antes de aparecer na loja. Para avaliar uma peça, abra o pedido pago." />

      {reviews.isPending ? (
        <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : reviews.isError ? (
        <ErrorState error={reviews.error} onRetry={() => void reviews.refetch()} retrying={reviews.isFetching} />
      ) : items.length === 0 ? (
        <EmptyState icon={<MessageSquareText className="size-7" aria-hidden="true" />} title="Você ainda não avaliou nenhuma peça" description="Depois que um pedido for pago, você poderá avaliar cada item no detalhe do pedido." />
      ) : (
        <ul className="space-y-4">
          {items.map((review) => (
            <li key={review.reviews_id} className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-5">
              <div className="flex gap-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                  <ProductImage src={review.order_item.product.cover_image?.product_image_url} alt="" className="size-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{review.order_item.product.product_name}</p>
                    <Badge tone={review.is_authorized ? "success" : "warning"}>{review.is_authorized ? "Publicada" : "Em moderação"}</Badge>
                  </div>

                  {editingId === review.reviews_id ? (
                    <div className="mt-3">
                      <EditReview reviewId={review.reviews_id}>
                        {(save) => (
                          <ReviewForm review={review} onCancel={() => setEditingId(null)} onSubmit={async (v) => { await save.mutateAsync(v); setEditingId(null); }} />
                        )}
                      </EditReview>
                    </div>
                  ) : (
                    <>
                      <div className="mt-1 flex items-center gap-2">
                        <StarRating value={review.reviews} />
                        <span className="text-xs text-ink-soft">{formatDate(review.created_at)}</span>
                      </div>
                      {review.comment && <p className="mt-2 whitespace-pre-wrap text-sm">{review.comment}</p>}
                      <div className="mt-3 flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(review.reviews_id)}><Pencil className="size-4" aria-hidden="true" />Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(review.reviews_id)}><Trash2 className="size-4" aria-hidden="true" />Excluir</Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir esta avaliação?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete, { onSettled: () => setToDelete(null) })}
      />
    </>
  );
}