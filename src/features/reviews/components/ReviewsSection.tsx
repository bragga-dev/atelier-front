import { MessageSquareQuote } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { StarRating } from "@/components/ui/StarRating";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format";
import { maskEmail } from "@/lib/mask";
import { useProductRatingSummary, useProductReviews } from "@/features/reviews/queries";

export function ReviewsSection({ productId }: { productId: string }) {
  const summary = useProductRatingSummary(productId);
  const reviews = useProductReviews(productId);

  const average = summary.data ? Number(summary.data.average_rating) : 0;
  const total = summary.data?.total_reviews ?? 0;

  return (
    <section aria-labelledby="avaliacoes" className="py-10">
      <Container className="max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <h2 id="avaliacoes" className="text-3xl font-semibold sm:text-4xl">
            Avaliações
          </h2>
          {!summary.isPending && total > 0 && (
            <span className="flex items-center gap-2 text-ink-soft">
              <StarRating value={average} />
              <span className="text-sm">
                {average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} · {total}{" "}
                {total === 1 ? "avaliação" : "avaliações"}
              </span>
            </span>
          )}
        </div>

        {reviews.isPending ? (
          <ul className="space-y-6" aria-busy="true" aria-label="Carregando avaliações">
            {Array.from({ length: 2 }, (_, i) => (
              <li key={i} className="space-y-2 border-b border-sand-200 pb-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </li>
            ))}
          </ul>
        ) : reviews.isError ? (
          <p className="text-ink-soft">Não foi possível carregar as avaliações agora.</p>
        ) : reviews.data && reviews.data.length > 0 ? (
          <ul className="space-y-6">
            {reviews.data.map((review) => (
              <li key={review.reviews_id} className="border-b border-sand-200 pb-6 last:border-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StarRating value={review.reviews} />
                  <span className="text-sm font-medium text-ink-soft">{maskEmail(review.user.email)}</span>
                  <span className="text-sm text-ink-soft/70">{formatDate(review.created_at)}</span>
                </div>
                {review.comment && <p className="mt-2 text-ink-soft">{review.comment}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 text-ink-soft">
            <MessageSquareQuote className="size-5 shrink-0" aria-hidden="true" />
            <p>Este produto ainda não tem avaliações.</p>
          </div>
        )}
      </Container>
    </section>
  );
}