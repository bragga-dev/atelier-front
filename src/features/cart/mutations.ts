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