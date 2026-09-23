import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/api/endpoints/cart";
import { queryKeys } from "@/api/query-keys";
import { toast } from "@/lib/toast";

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.all, cart);
      toast.success("Produto adicionado ao carrinho.");
    },
  });
}

/** Define a quantidade exata de um item já no carrinho (usado pelo estepe na página do carrinho). */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, quantityItem }: { cartItemId: string; quantityItem: number }) =>
      cartApi.updateItem(cartItemId, { quantity_item: quantityItem }),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart.all, cart),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) => cartApi.removeItem(cartItemId),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.all, cart);
      toast.success("Item removido do carrinho.");
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.clear,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.all, cart);
      toast.success("Carrinho esvaziado.");
    },
  });
}