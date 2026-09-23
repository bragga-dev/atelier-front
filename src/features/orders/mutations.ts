import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/api/endpoints/orders";
import { queryKeys } from "@/api/query-keys";
import type { OrderCreateIn } from "@/api/types";

/** Checkout do carrinho: cria o pedido a partir do endereço escolhido. */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderCreateIn) => ordersApi.create(payload),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.order_id), order);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      // O backend esvazia o carrinho ao criar o pedido — reflete isso no cache local.
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancel(orderId),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.order_id), order);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}