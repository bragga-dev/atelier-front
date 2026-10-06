import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { OrderOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/panel/Section";
import { useCreateReview, useMyReviews } from "../hooks";
import { ReviewForm } from "./ReviewForm";

/** "Avalie suas peças": só aparece em pedidos pagos. Cada item pode ser avaliado uma vez. */
export function OrderReviews({ order }: { order: OrderOut }) {
  const myReviews = useMyReviews();
  const create = useCreateReview();
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  if (order.order_status !== "COMPLETED" || !(order.items ?? []).length) return null;
  const reviewed = new Set((myReviews.data ?? []).map((r) => r.order_item.order_item_id));

  return (
    <Section title="Avalie suas peças" description="Sua opinião ajuda outras clientes. A avaliação aparece na loja depois de moderada.">
      <ul className="divide-y divide-sand-200">
        {(order.items ?? []).map((item) => (
          <li key={item.order_item_id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-semibold">{item.product.product_name}</span>
              {reviewed.has(item.order_item_id) ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-emerald-700"><CheckCircle2 className="size-4" aria-hidden="true" />Avaliada</span>
              ) : (
                <Button variant="outline" size="sm" disabled={myReviews.isPending} onClick={() => setOpenItemId(openItemId === item.order_item_id ? null : item.order_item_id)} aria-expanded={openItemId === item.order_item_id}>
                  Avaliar
                </Button>
              )}
            </div>
            {openItemId === item.order_item_id && (
              <div className="mt-4">
                <ReviewForm
                  submitLabel="Enviar avaliação"
                  onCancel={() => setOpenItemId(null)}
                  onSubmit={async (v) => { await create.mutateAsync({ order_item_id: item.order_item_id, reviews: v.reviews, comment: v.comment }); setOpenItemId(null); }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}