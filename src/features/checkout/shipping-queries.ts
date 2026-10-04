import { useQueries } from "@tanstack/react-query";
import { shippingApi } from "@/api/endpoints/shipping";
import { queryKeys } from "@/api/query-keys";
import type { CartItemOut } from "@/api/types";
import { combineShippingQuotes, type CartShippingChoice } from "./shipping-options";

interface CartShippingState {
  choices: CartShippingChoice[];
  isPending: boolean;
  isError: boolean;
  /** Erros (por item) — o primeiro serve de mensagem para a tela. */
  errors: unknown[];
  refetch: () => void;
}

/** Cota o frete de cada item do carrinho para o CEP e junta os resultados em opções do carrinho. */
export function useCartShippingChoices(items: CartItemOut[], cep: string | null): CartShippingState {
  const digits = (cep ?? "").replace(/\D/g, "");

  const results = useQueries({
    queries: items.map((item) => ({
      queryKey: queryKeys.shipping.quote(item.product.product_id, digits, item.quantity_item),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        shippingApi.quote(item.product.product_id, digits, item.quantity_item, signal),
      enabled: digits.length === 8,
      staleTime: 5 * 60_000,
      // Falha da Frenet ou "produto sem frete cadastrado": a tela mostra o erro e oferece tentar de novo.
      retry: false,
      meta: { errorToast: false },
    })),
  });

  const isPending = digits.length === 8 && results.some((result) => result.isPending);
  const failed = results.filter((result) => result.isError);

  return {
    choices: isPending || failed.length > 0 ? [] : combineShippingQuotes(results.map((result) => result.data ?? [])),
    isPending,
    isError: failed.length > 0,
    errors: failed.map((result) => result.error),
    refetch: () => failed.forEach((result) => void result.refetch()),
  };
}