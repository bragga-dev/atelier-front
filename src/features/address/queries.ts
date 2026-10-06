// frontend/src/features/address/queries.ts
import { useQuery } from "@tanstack/react-query";
import { addressesApi } from "@/api/endpoints/addresses";
import { queryKeys } from "@/api/query-keys";
import { useCartEnabled } from "@/features/cart/queries";

/** Endereços do cliente (checkout e painel "Minha conta"). */
export function useAddresses() {
  const enabled = useCartEnabled(); // só contas de cliente têm endereços
  return useQuery({
    queryKey: queryKeys.addresses.list,
    queryFn: ({ signal }) => addressesApi.list(signal),
    enabled,
    staleTime: 60_000,
  });
}