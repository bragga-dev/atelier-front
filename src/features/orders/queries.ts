import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/api/endpoints/orders";
import { queryKeys } from "@/api/query-keys";
import { useAuth } from "@/features/auth/auth-context";

function useOrdersEnabled(): boolean {
  const { me } = useAuth();
  return me?.user.role === "client";
}

export function useOrders() {
  const enabled = useOrdersEnabled();
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: ({ signal }) => ordersApi.list(signal),
    enabled,
  });
}

export function useOrder(orderId: string) {
  const enabled = useOrdersEnabled();
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: ({ signal }) => ordersApi.get(orderId, signal),
    enabled: enabled && Boolean(orderId),
  });
}