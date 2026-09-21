import { useQuery } from "@tanstack/react-query";
import { cartApi } from "@/api/endpoints/cart";
import { queryKeys } from "@/api/query-keys";
import { useAuth } from "@/features/auth/auth-context";

/** O carrinho vive no servidor e só existe para clientes logados. */
function useCartEnabled(): boolean {
  const { me } = useAuth();
  return me?.user.role === "client";
}

export function useCart() {
  const enabled = useCartEnabled();
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: ({ signal }) => cartApi.get(signal),
    enabled,
    staleTime: 30_000,
  });
}

/** Total de unidades no carrinho (badge do header). */
export function useCartItemCount() {
  const enabled = useCartEnabled();
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: ({ signal }) => cartApi.get(signal),
    enabled,
    staleTime: 30_000,
    select: (cart) => cart.items.reduce((total, item) => total + item.quantity_item, 0),
  });
}
