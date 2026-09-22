import { useMutation } from "@tanstack/react-query";
import { shippingApi } from "@/api/endpoints/shipping";
import { isApiError } from "@/api/errors";

/** Cotação sob demanda: cota pela quantidade selecionada no momento do clique (não é GET automático). */
export function useShippingQuote(productId: string, quantity: number) {
  return useMutation({
    mutationFn: ({ cep }: { cep: string }) => shippingApi.quote(productId, cep, quantity),
    meta: { errorToast: false }, // o card de frete mostra o próprio erro, sem duplicar em toast
  });
}

/** 404 aqui é "este produto ainda não tem frete cadastrado" — não é erro de rede/servidor. */
export function isShippingNotConfigured(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}