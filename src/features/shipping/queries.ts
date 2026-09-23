import { useMutation } from "@tanstack/react-query";
import { shippingApi } from "@/api/endpoints/shipping";
import { isApiError } from "@/api/errors";

export function useShippingQuote(productId: string, quantity: number) {
  return useMutation({
    mutationFn: ({ cep }: { cep: string }) => shippingApi.quote(productId, cep, quantity),
    meta: { errorToast: false }, 
  });
}

export function isShippingNotConfigured(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}