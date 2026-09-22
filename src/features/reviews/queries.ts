import { useQuery } from "@tanstack/react-query";
import { reviewsApi } from "@/api/endpoints/reviews";
import { queryKeys } from "@/api/query-keys";

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.forProduct(productId),
    queryFn: ({ signal }) => reviewsApi.forProduct(productId, signal),
    staleTime: 60_000,
  });
}

export function useProductRatingSummary(productId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.summary(productId),
    queryFn: ({ signal }) => reviewsApi.summary(productId, signal),
    staleTime: 60_000,
  });
}