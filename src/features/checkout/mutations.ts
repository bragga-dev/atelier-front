import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addressesApi } from "@/api/endpoints/addresses";
import { ordersApi } from "@/api/endpoints/orders";
import { profileApi } from "@/api/endpoints/profile";
import { queryKeys } from "@/api/query-keys";
import type { AddressOut } from "@/api/types";
import { useAuth } from "@/features/auth/auth-context";

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.create,
    onSuccess: (created) => {
      // O backend torna o novo endereço o preferencial (e desmarca os outros) — reflete no cache.
      queryClient.setQueryData<AddressOut[]>(queryKeys.addresses.list, (current = []) => [
        created,
        ...current.map((address) => ({ ...address, is_preferential: false })),
      ]);
    },
    meta: { errorToast: false },
  });
}

export function useUpdateClientProfile() {
  const { refreshMe } = useAuth();

  return useMutation({
    mutationFn: profileApi.updateClient,
    onSuccess: () => refreshMe(),
    meta: { errorToast: false },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.order_id), order);
      // O backend esvaziou o carrinho e baixou o estoque dos produtos.
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.list });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    meta: { errorToast: false },
  });
}