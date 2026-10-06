import { http } from "../http";
import type { ProductRatingSummaryOut, ReviewCreateIn, ReviewOut, ReviewPrivateOut, ReviewUpdateIn } from "../types";

export const reviewsApi = {
  forProduct: (productId: string, signal?: AbortSignal) =>
    http.get<ReviewOut[]>(`/reviews/products/${productId}`, { signal, auth: false }),

  summary: (productId: string, signal?: AbortSignal) =>
    http.get<ProductRatingSummaryOut>(`/reviews/products/${productId}/summary`, { signal, auth: false }),

  // Cliente (dono da avaliação)
  create: (payload: ReviewCreateIn) => http.post<ReviewPrivateOut>("/reviews/", payload),
  mine: (signal?: AbortSignal) => http.get<ReviewPrivateOut[]>("/reviews/me", { signal }),
  update: (reviewId: string, payload: ReviewUpdateIn) => http.patch<ReviewPrivateOut>(`/reviews/me/${reviewId}`, payload),
  remove: (reviewId: string) => http.delete<void>(`/reviews/me/${reviewId}`),

  // Admin (moderação)
  adminPending: (signal?: AbortSignal) => http.get<ReviewPrivateOut[]>("/reviews/admin/pending", { signal }),
  adminAuthorized: (signal?: AbortSignal) => http.get<ReviewPrivateOut[]>("/reviews/admin/authorized", { signal }),
  authorize: (reviewId: string) => http.post<ReviewPrivateOut>(`/reviews/admin/${reviewId}/authorize`),
  revoke: (reviewId: string) => http.post<ReviewPrivateOut>(`/reviews/admin/${reviewId}/revoke`),
  adminRemove: (reviewId: string) => http.delete<void>(`/reviews/admin/${reviewId}`),
};