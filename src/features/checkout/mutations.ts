// frontend/src/features/checkout/mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/api/endpoints/orders";
import { profileApi } from "@/api/endpoints/profile";
import { queryKeys } from "@/api/query-keys";
import { useAuth } from "@/features/auth/auth-context";

export { useCreateAddress } from "@/features/address/mutations";

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