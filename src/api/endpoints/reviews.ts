import { http } from "../http";
import type { ProductRatingSummaryOut, ReviewOut } from "../types";

export const reviewsApi = {
  forProduct: (productId: string, signal?: AbortSignal) =>
    http.get<ReviewOut[]>(`/reviews/products/${productId}`, { signal, auth: false }),

  summary: (productId: string, signal?: AbortSignal) =>
    http.get<ProductRatingSummaryOut>(`/reviews/products/${productId}/summary`, { signal, auth: false }),
};