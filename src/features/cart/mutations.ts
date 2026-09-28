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

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      cartApi.updateItemQuantity(cartItemId, { quantity_item: quantity }),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart.all, cart),
    // A própria linha do item mostra o erro (ex.: estoque insuficiente) — sem toast duplicado.
    meta: { errorToast: false },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) => cartApi.removeItem(cartItemId),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart.all, cart),
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.all, cart);
      toast.success("Carrinho esvaziado.");
    },
  });
}